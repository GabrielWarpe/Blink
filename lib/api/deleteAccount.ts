import { supabase } from '@/services/supabase';

/**
 * Exclusão definitiva da conta.
 *
 * Exigência de loja, não capricho: a diretriz 5.1.1(v) da Apple obriga o app a
 * oferecer a exclusão AQUI DENTRO — encaminhar para o suporte por e-mail é
 * motivo de recusa na revisão. Ver a Edge Function `delete-account`, que é
 * quem de fato apaga (precisa da `service_role`, que não pode viver no app).
 *
 * O que some: o perfil, todos os decks e cards, o histórico de estudo, as
 * publicações na comunidade, as avaliações e os arquivos enviados. As cópias
 * que OUTRAS pessoas baixaram de um deck seu continuam com elas — são linhas
 * na conta delas, e apagá-las seria apagar dado de terceiro.
 */
export type DeleteAccountResult =
  | { ok: true; files: number }
  | { ok: false; message: string };

export async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    const { data, error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });

    if (error) {
      return {
        ok: false,
        message:
          'Não foi possível excluir a conta agora. Verifique sua conexão e tente de novo.',
      };
    }

    const body = data as { deleted?: boolean; files?: number } | null;
    if (!body?.deleted) {
      return { ok: false, message: 'A exclusão não foi concluída. Tente de novo.' };
    }

    // A sessão local aponta para um usuário que não existe mais: limpar aqui
    // evita o app ficar tentando renovar um token órfão e mostrando erros de
    // rede em vez da tela de entrada.
    await supabase.auth.signOut();
    return { ok: true, files: body.files ?? 0 };
  } catch {
    return {
      ok: false,
      message: 'Não foi possível excluir a conta agora. Tente de novo.',
    };
  }
}
