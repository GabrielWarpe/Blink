import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import { supabase } from './supabase';

/**
 * Imagens dos flashcards: seleção, compressão e upload.
 *
 * Arquitetura: as imagens vivem no Supabase Storage (bucket `card-images`,
 * leitura pública) e o card guarda apenas as URLs — o banco continua leve e
 * as URLs seguem válidas em decks exportados/compartilhados. O nome do
 * arquivo é o SHA-256 do conteúdo, então a mesma imagem nunca é duplicada.
 */

/**
 * Pré-carrega (memória + disco) as imagens remotas de um conjunto de cards.
 * Chamado no início da sessão de estudo para que cada card apareça com a
 * imagem já pronta, sem espera de rede.
 */
export function prefetchCardImages(cards: { images: string[] }[]): void {
  const urls = [...new Set(cards.flatMap(c => c.images))].filter(u =>
    /^https?:\/\//.test(u),
  );
  if (urls.length > 0) {
    void Image.prefetch(urls, { cachePolicy: 'memory-disk' });
  }
}

export const MAX_IMAGES_PER_CARD = 4;
const MAX_DIMENSION = 1600; // px no lado maior — qualidade boa, upload leve
const JPEG_QUALITY = 0.8;
const BUCKET = 'card-images';


/** Imagem em edição: local (com base64 a enviar) ou já hospedada (só URL). */
export interface CardImage {
  uri: string;
  base64?: string;
}

/**
 * Abre a galeria (seleção múltipla), redimensiona para no máximo 1600px e
 * comprime em JPEG. Devolve pares uri (preview) + base64 (upload/IA).
 */
export async function pickCardImages(maxCount: number): Promise<CardImage[]> {
  if (maxCount <= 0) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: maxCount,
    quality: 1, // a compressão fica por conta do manipulator, abaixo
  });
  if (result.canceled) return [];

  const picked: CardImage[] = [];
  for (const asset of result.assets.slice(0, maxCount)) {
    const largest = Math.max(asset.width ?? 0, asset.height ?? 0);
    const actions: ImageManipulator.Action[] =
      largest > MAX_DIMENSION
        ? [
            (asset.width ?? 0) >= (asset.height ?? 0)
              ? { resize: { width: MAX_DIMENSION } }
              : { resize: { height: MAX_DIMENSION } },
          ]
        : [];
    const out = await ImageManipulator.manipulateAsync(asset.uri, actions, {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (out.base64) picked.push({ uri: out.uri, base64: out.base64 });
  }
  return picked;
}

/**
 * Abre a galeria para escolher a CAPA do deck — mesmo caminho da foto de
 * perfil: picker com corte quadrado e base64 direto, sem manipulator. A capa
 * não usa o Storage: é salva como data URI na coluna `cover_url` do deck.
 */
export async function pickDeckCover(): Promise<CardImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.4,
    base64: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset?.base64) return null;
  return { uri: asset.uri, base64: asset.base64 };
}

/**
 * Converte a imagem escolhida no valor a salvar em `cover_url`: nova (com
 * base64) vira data URI; já salva (URL http ou data URI) passa direto.
 */
export function imageToDataUri(img: CardImage): string {
  return img.base64 ? `data:image/jpeg;base64,${img.base64}` : img.uri;
}

/** Decodifica base64 sem depender de `atob` (indisponível em alguns runtimes). */
function base64ToBytes(b64: string): Uint8Array {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const ch of clean) {
    buffer = (buffer << 6) | alphabet.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[index++] = (buffer >> bits) & 0xff;
    }
  }
  return out.subarray(0, index);
}

/**
 * Sobe as imagens locais e devolve a lista final de URLs (as já hospedadas
 * passam direto). Nome por hash do conteúdo + upsert = sem duplicatas.
 */
export async function uploadCardImages(
  userId: string,
  images: CardImage[],
): Promise<string[]> {
  const urls: string[] = [];
  for (const img of images) {
    if (!img.base64) {
      urls.push(img.uri); // já é uma URL hospedada (card em edição)
      continue;
    }
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      img.base64,
    );
    const path = `${userId}/${hash}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, base64ToBytes(img.base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (error) {
      throw new Error(
        /bucket/i.test(error.message)
          ? 'O bucket "card-images" não existe no Supabase. Rode o SQL de configuração de imagens.'
          : `Falha ao enviar imagem: ${error.message}`,
      );
    }
    urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return urls;
}
