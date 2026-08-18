import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  extractDocument,
  detectSourceFormat,
  IMPORT_STATUS_LABEL,
  FORMAT_HELP,
  MAX_SOURCE_BYTES,
  PICKER_MIME_TYPES,
  type Extraction,
  type ImportStats,
  type ImportStatus,
  type SourceFormat,
  type SourceKind,
} from '@/lib/api/importDocument';
import { CardImages } from '@/components/CardImages';
import { Button } from '@/components/ui/Button';
import { cardShadow } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Importar material: anexa um arquivo e mostra o que saiu dele — texto e
 * figuras — SEM chamar a IA.
 *
 * É o passo de conferência do fluxo de importação: dá para ver se as figuras do
 * material valem virar card antes de gastar geração com o arquivo. Quem faz a
 * leitura é o serviço de extração; aqui só se anexa e se olha o resultado.
 */

const ICON: Record<SourceKind, string> = {
  pdf: 'document-text',
  pptx: 'easel',
  docx: 'document-text',
  image: 'image',
};

const KIND_LABEL: Record<SourceKind, string> = {
  pdf: 'PDF',
  pptx: 'PowerPoint',
  docx: 'Word',
  image: 'Imagem',
};

/** Quantos caracteres do texto extraído mostrar na conferência. */
const TEXT_PREVIEW_CHARS = 1200;

interface Attachment {
  name: string;
  base64: string;
  format: SourceFormat;
}

export default function ImportScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<ImportStatus | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [stats, setStats] = useState<ImportStats>({});

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: PICKER_MIME_TYPES,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      if (!file) return;

      // O seletor filtra por tipo, mas nem todo sistema respeita o filtro —
      // barrar aqui é o que garante mensagem clara em vez de erro lá na frente.
      const format = detectSourceFormat(file.mimeType, file.name);
      if (!format) {
        Alert.alert('Formato não suportado', FORMAT_HELP);
        return;
      }
      if (file.size != null && file.size > MAX_SOURCE_BYTES) {
        Alert.alert(
          'Arquivo muito grande',
          `Escolha um arquivo de até ${Math.floor(MAX_SOURCE_BYTES / 1024 / 1024)} MB.`,
        );
        return;
      }

      const base64 = await new FileSystem.File(file.uri).base64();
      setAttachment({ name: file.name, base64, format });
      setExtraction(null);
      setStats({});
    } catch {
      Alert.alert('Erro', 'Não foi possível ler o arquivo.');
    }
  };

  const handleExtract = async () => {
    if (!attachment) return;
    setRunning(true);
    setExtraction(null);
    try {
      const result = await extractDocument(
        {
          base64: attachment.base64,
          name: attachment.name,
          format: attachment.format,
        },
        setProgress,
      );
      if (!result.ok) {
        Alert.alert('Não foi possível ler o arquivo', result.message);
        return;
      }
      setExtraction(result.extraction);
      setStats(result.stats);
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  // As figuras agrupadas pela página de origem: conferir extração é justamente
  // olhar "o que veio da página 8?".
  const byPage = useMemo(() => {
    const groups = new Map<number, string[]>();
    for (const figure of extraction?.imagens ?? []) {
      if (!figure.url) continue;
      const list = groups.get(figure.pagina) ?? [];
      list.push(figure.url);
      groups.set(figure.pagina, list);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [extraction]);

  const pageWord = extraction?.fonte.type === 'pptx' ? 'Slide' : 'Página';

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-4 border-b border-outline-variant/20">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-on-surface font-jakarta-bold text-lg">
          Importar material
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Anexo */}
        {attachment ? (
          <View
            className="flex-row items-center gap-2 bg-surface-container rounded-card px-3 py-2.5"
            style={cardShadow}
          >
            <Ionicons
              name={ICON[attachment.format.kind] as never}
              size={18}
              color={colors.primary}
            />
            <View className="flex-1">
              <Text
                className="text-on-surface font-inter-medium text-sm"
                numberOfLines={1}
              >
                {attachment.name}
              </Text>
              <Text className="text-outline font-inter-regular text-xs">
                {KIND_LABEL[attachment.format.kind]}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setAttachment(null);
                setExtraction(null);
              }}
              disabled={running}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.outline} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => void pickFile()}
            activeOpacity={0.85}
            className="items-center gap-2 bg-surface-container rounded-card px-4 py-8 border border-dashed border-outline-variant"
          >
            <Ionicons name="cloud-upload-outline" size={30} color={colors.primary} />
            <Text className="text-on-surface font-inter-semibold text-base">
              Escolher arquivo
            </Text>
            <Text className="text-outline font-inter-regular text-xs text-center leading-4">
              {FORMAT_HELP}
            </Text>
          </TouchableOpacity>
        )}

        {attachment && (
          <Button
            variant="primary"
            size="lg"
            onPress={() => void handleExtract()}
            loading={running}
          >
            {running ? 'Lendo...' : 'Ler arquivo'}
          </Button>
        )}

        {/* Progresso: sem isto o botão fica girando sem dizer o que acontece. */}
        {progress != null && (
          <View
            className="flex-row items-center gap-2.5 bg-surface-container rounded-card px-3 py-2.5"
            style={cardShadow}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="flex-1 text-on-surface-variant font-inter-medium text-sm">
              {IMPORT_STATUS_LABEL[progress]}
            </Text>
          </View>
        )}

        {extraction && (
          <>
            {/* Números da extração */}
            <View
              className="bg-surface-container rounded-card p-4 gap-3"
              style={cardShadow}
            >
              <Text className="text-on-surface font-jakarta-bold text-base">
                O que saiu do arquivo
              </Text>
              <View className="flex-row flex-wrap gap-y-3">
                <Stat
                  label={extraction.fonte.type === 'pptx' ? 'Slides' : 'Páginas'}
                  value={String(stats.pages ?? extraction.fonte.pages)}
                />
                <Stat
                  label="Figuras"
                  value={`${stats.images_kept ?? 0} de ${stats.images_found ?? 0}`}
                />
                <Stat
                  label="Texto"
                  value={`${(stats.chars ?? extraction.texto.length).toLocaleString('pt-BR')} car.`}
                />
              </View>
            </View>

            {/* Avisos: o que a extração NÃO conseguiu, dito na cara. */}
            {extraction.avisos.map(aviso => (
              <View
                key={aviso.code}
                className="flex-row gap-2.5 bg-surface-container rounded-card px-3 py-3"
                style={cardShadow}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={colors.warning}
                />
                <Text className="flex-1 text-on-surface-variant font-inter-regular text-xs leading-5">
                  {aviso.message}
                </Text>
              </View>
            ))}

            {/* Figuras extraídas, por página de origem */}
            {byPage.length > 0 ? (
              <View
                className="bg-surface-container rounded-card p-4 gap-4"
                style={cardShadow}
              >
                <Text className="text-on-surface font-jakarta-bold text-base">
                  Figuras aproveitáveis
                </Text>
                {byPage.map(([page, urls]) => (
                  <View key={page} className="gap-2">
                    <Text className="text-outline font-inter-medium text-xs">
                      {pageWord} {page}
                    </Text>
                    <CardImages images={urls} size={92} />
                  </View>
                ))}
              </View>
            ) : (
              <View
                className="bg-surface-container rounded-card p-4"
                style={cardShadow}
              >
                <Text className="text-on-surface-variant font-inter-regular text-sm leading-5">
                  Nenhuma figura aproveitável neste arquivo. Os cards ainda podem
                  ser gerados a partir do texto.
                </Text>
              </View>
            )}

            {/* Texto extraído */}
            {extraction.texto.trim().length > 0 && (
              <View
                className="bg-surface-container rounded-card p-4 gap-2"
                style={cardShadow}
              >
                <Text className="text-on-surface font-jakarta-bold text-base">
                  Texto extraído
                </Text>
                {/* Sem esta linha o usuário acha que só o trecho visível vai
                    para a geração — e o começo de apostila costuma ser capa e
                    recado de autor, o pior retrato possível do conteúdo. */}
                <Text className="text-outline font-inter-regular text-xs">
                  Amostra do início — o documento inteiro (
                  {stats.pages ?? extraction.fonte.pages}{' '}
                  {extraction.fonte.type === 'pptx' ? 'slides' : 'páginas'}) será
                  usado na geração.
                </Text>
                <Text className="text-on-surface-variant font-inter-regular text-xs leading-5">
                  {extraction.texto.slice(0, TEXT_PREVIEW_CHARS)}
                  {extraction.texto.length > TEXT_PREVIEW_CHARS ? '…' : ''}
                </Text>
              </View>
            )}

            <Text className="text-outline font-inter-regular text-xs text-center leading-4">
              A geração de cards a partir deste material entra na próxima etapa.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/3 gap-0.5">
      <Text className="text-on-surface font-jakarta-bold text-lg">{value}</Text>
      <Text className="text-outline font-inter-regular text-xs">{label}</Text>
    </View>
  );
}
