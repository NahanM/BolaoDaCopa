// Único ponto do código que lê a flag VITE_BOLAO_ENCERRADO.
//
// O Vite fixa o valor durante o build. Por isso, ligar ou desligar o modo
// encerrado na Vercel exige publicar uma nova versão.

// Só "true" liga o modo encerrado.
// Qualquer outro valor, inclusive vazio, mantém o bolão aberto.
export function parseBolaoEncerrado(value?: string): boolean {
  return value?.trim().toLowerCase() === 'true';
}

// import.meta.env só existe dentro do Vite. Nos testes executados com tsx,
// ele é undefined e o bolão é tratado como aberto.
const viteEnv = import.meta.env as
  | Record<string, string | undefined>
  | undefined;

export const BOLAO_ENCERRADO = parseBolaoEncerrado(
  viteEnv?.VITE_BOLAO_ENCERRADO
);
