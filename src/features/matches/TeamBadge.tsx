import {
  useState,
} from 'react';

// Dados necessários para representar
// visualmente um time.
interface TeamBadgeProps {
  // Código ou abreviação do país/time.
  //
  // Exemplos:
  // BRA
  // POR
  // ESP
  flag?: string;

  // Endereço do escudo.
  //
  // Pode estar ausente,
  // ser null ou falhar durante
  // o carregamento.
  logo?: string | null;

  // Nome utilizado:
  //
  // - no texto alternativo da imagem;
  // - na criação das iniciais do fallback.
  name: string;
}

// Prepara o texto que será mostrado
// quando não houver uma imagem válida.
function getFallbackCode(
  flag?: string,
  name?: string
): string {
  // Remove espaços antes e depois
  // do possível código.
  const cleanFlag =
    flag?.trim();

  // Utiliza a flag quando ela contém
  // somente de duas a quatro letras.
  //
  // Exemplos válidos:
  //
  // BR
  // BRA
  // POR
  // USA
  if (
    cleanFlag &&
    /^[A-Za-z]{2,4}$/.test(
      cleanFlag
    )
  ) {
    return cleanFlag.toUpperCase();
  }

  // Quando não existe um código válido,
  // tenta criar iniciais com o nome.
  if (name) {
    const initials =
      name
        // Divide o nome em palavras.
        .split(' ')

        // Remove partes vazias,
        // inclusive espaços duplicados.
        .filter(Boolean)

        // Considera somente
        // as duas primeiras palavras.
        .slice(0, 2)

        // Pega a primeira letra
        // de cada palavra.
        .map(
          (word) =>
            word[0]
        )

        // Junta as letras.
        .join('')

        // Padroniza em maiúsculas.
        .toUpperCase();

    // Protege contra um nome
    // composto somente por espaços.
    if (initials) {
      return initials;
    }
  }

  // Último fallback possível.
  return 'FC';
}

// Exibe o escudo do time.
//
// Quando a imagem estiver ausente
// ou falhar, mostra um código textual.
export function TeamBadge({
  flag,
  logo,
  name,
}: TeamBadgeProps) {
  // Guarda a URL específica
  // que apresentou erro.
  //
  // Isso é melhor do que guardar
  // apenas true ou false, porque permite
  // testar uma nova URL caso a prop mude.
  const [
    failedLogo,
    setFailedLogo,
  ] = useState<string | null>(
    null
  );

  // A imagem pode aparecer quando:
  //
  // - existe uma URL;
  // - essa URL não é a mesma
  //   que já apresentou erro.
  const shouldShowLogo =
    Boolean(
      logo &&
      failedLogo !== logo
    );

  if (
    shouldShowLogo &&
    logo
  ) {
    return (
      <img
        src={logo}
        alt={name}

        // Mantém o escudo dentro
        // de uma área de 44 x 44 pixels
        // sem distorcer sua proporção.
        className="h-11 w-11 object-contain drop-shadow-sm"

        // Permite que imagens fora
        // da área visível sejam carregadas
        // somente quando necessário.
        loading="lazy"

        // Registra exatamente
        // qual URL apresentou erro.
        //
        // Após a atualização do estado,
        // o componente renderiza o fallback.
        onError={
          () =>
            setFailedLogo(
              logo
            )
        }
      />
    );
  }

  return (
    // Substituição visual usada quando:
    //
    // - não existe logo;
    // - a URL da logo apresentou erro.
    <span
      role="img"
      aria-label={name}
      title={name}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-black text-slate-800 shadow-sm"
    >
      {getFallbackCode(
        flag,
        name
      )}
    </span>
  );
}