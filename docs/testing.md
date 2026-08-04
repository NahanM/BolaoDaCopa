# Testes do projeto

Este documento descreve a estratégia de testes do **Bolão da Copa 2026**, os cenários cobertos e os comandos disponíveis para validação do projeto.

## Visão geral

Os testes utilizam:

* `node:assert/strict` para asserções;
* `tsx` para executar arquivos TypeScript;
* Playwright para testes em navegadores;
* funções reais da camada de domínio;
* componentes React renderizados em ambiente controlado.

O projeto não utiliza Jest ou Vitest.

Os testes foram organizados em scripts independentes para validar:

* regras de negócio;
* regressões;
* normalização de dados;
* comportamento com volumes maiores;
* compatibilidade entre navegadores;
* build de produção;
* tipagem TypeScript.

## Preparação do ambiente

Instale as dependências do projeto:

```bash
npm ci
```

Para executar os testes de navegador, instale os navegadores utilizados pelo Playwright:

```bash
npx playwright install chromium firefox
```

## Testes disponíveis

| Comando                   | Finalidade                                               |
| ------------------------- | -------------------------------------------------------- |
| `npm run test:unit`       | Valida regras de negócio e regressões da interface.      |
| `npm run test:migration`  | Valida consolidação e compatibilidade com dados antigos. |
| `npm run test:volume`     | Avalia comportamento com maior quantidade de dados.      |
| `npm run test:resilience` | Valida normalização de documentos inconsistentes.        |
| `npm run test:browsers`   | Executa testes de navegação em diferentes navegadores.   |
| `npm run typecheck`       | Verifica a tipagem TypeScript.                           |
| `npm run build`           | Gera e valida o build de produção.                       |
| `npm run test:all`        | Executa as principais verificações automatizadas.        |

## Testes unitários e de regressão

Comando:

```bash
npm run test:unit
```

Arquivo principal:

```text
scripts/unitRegressionTest.tsx
```

Essa suíte valida as principais regras do bolão:

* pontuação por placar exato;
* pontuação por vencedor ou empate correto;
* palpites incorretos;
* partidas sem palpite;
* criação e ordenação da classificação;
* critérios de desempate;
* ajustes manuais de pontuação;
* filtros de partidas;
* bloqueio de palpites;
* cálculo da premiação;
* estados relevantes do componente `MatchCard`.

As funções reais da camada de domínio são utilizadas nos testes para reduzir a diferença entre o comportamento testado e o comportamento executado pela aplicação.

## Testes de consolidação e migração

Comando:

```bash
npm run test:migration
```

Arquivo principal:

```text
scripts/migrationConsolidationTest.ts
```

Essa suíte valida:

* normalização de e-mails;
* identificação de participantes duplicados;
* escolha do documento principal;
* união dos palpites;
* tratamento de conflitos;
* preservação do palpite atualizado mais recentemente;
* manutenção dos ajustes manuais;
* classificação após a consolidação;
* prevenção de duplicidade no cálculo da premiação.

Os dados são criados apenas em memória. O teste não acessa nem modifica o Firestore.

Essa suíte deve ser mantida enquanto o projeto conservar funcionalidades de consolidação ou compatibilidade com documentos antigos.

## Testes de volume

Comando:

```bash
npm run test:volume
```

Arquivo principal:

```text
scripts/dataVolumeTest.ts
```

O cenário atual simula:

```text
104 partidas
15 participantes
1.560 palpites
```

São avaliados:

* tempo de cálculo da classificação;
* criação das linhas de auditoria;
* paginação dos resultados;
* filtros por partida;
* quantidade de registros processados;
* tamanho aproximado dos documentos dos participantes.

O teste utiliza dados gerados em memória e não acessa o banco de produção.

Seu objetivo é identificar problemas de desempenho ou crescimento excessivo dos documentos antes que eles afetem o uso real da aplicação.

## Testes de resiliência dos dados

Comando:

```bash
npm run test:resilience
```

Arquivo principal:

```text
scripts/dataResilienceTest.ts
```

Essa suíte verifica o comportamento da aplicação diante de documentos inconsistentes, incluindo:

* campos ausentes;
* valores nulos;
* tipos incorretos;
* números armazenados como texto;
* formatos diferentes de data;
* identificadores divergentes;
* textos maiores que o esperado;
* objetos inválidos;
* palpites incompletos ou corrompidos.

O foco principal é validar os normalizadores localizados em:

```text
src/services/firestoreNormalizers.ts
```

O teste também executa cenários com diferentes quantidades de partidas e participantes.

## Testes em navegadores

Comando:

```bash
npm run test:browsers
```

Arquivo principal:

```text
scripts/browserSmokeTest.ts
```

Essa suíte executa um teste de fumaça da aplicação em navegadores reais.

O processo:

1. gera o build de produção;
2. inicia um servidor local com `vite preview`;
3. abre os navegadores configurados;
4. testa a aplicação em resoluções desktop e mobile;
5. valida os principais fluxos de navegação;
6. verifica funcionalidades relacionadas ao clipboard;
7. captura erros apresentados no console do navegador;
8. encerra o servidor ao final da execução.

A aplicação de teste é servida em:

```text
http://127.0.0.1:4174
```

Não é necessário executar `npm run dev` antes desse teste.

### Navegadores

A suíte pode executar testes em:

* Chromium;
* Firefox;
* Microsoft Edge, quando encontrado no ambiente.

A ausência de um navegador opcional não deve impedir a execução dos navegadores obrigatórios configurados no teste.

### Ambiente isolado

Os testes de navegador utilizam configurações próprias para evitar dependência do ambiente Firebase de produção.

Nenhuma credencial real deve ser necessária para executar a suíte.

Caso o teste utilize um modo de dados locais ou fallback, essa configuração deve permanecer documentada no `.env.example` ou no próprio script de teste.

## Validação completa

Para executar as principais verificações do projeto:

```bash
npm run test:all
```

Essa rotina deve executar, de acordo com a configuração do `package.json`:

```text
testes unitários
        ↓
testes de migração
        ↓
testes de volume
        ↓
testes de resiliência
        ↓
verificação do TypeScript
        ↓
build de produção
```

Os testes de navegador podem permanecer separados por exigirem a instalação dos navegadores e consumirem mais recursos.

Caso o projeto possua um comando que agrupe todas as verificações, incluindo os navegadores, ele deve estar documentado nesta seção com o nome exato definido no `package.json`.

## Resultado dos testes

Um teste é considerado aprovado quando o comando termina sem erros.

Em caso de falha, o processo retorna um código diferente de zero e apresenta a asserção, etapa ou arquivo responsável pelo problema.

Quando os comandos são encadeados com `&&`, a execução é interrompida na primeira falha.

## Problemas comuns

### Script não encontrado

Exemplo:

```text
Missing script: "test:resilience"
```

Confirme se o comando está cadastrado na seção `scripts` do `package.json`.

### Navegador não instalado

Exemplo:

```text
Executable doesn't exist
```

Instale os navegadores utilizados pelo Playwright:

```bash
npx playwright install chromium firefox
```

### Porta de teste ocupada

Os testes de navegador utilizam a porta `4174`.

Encerre o processo que estiver utilizando essa porta antes de executar novamente a suíte.

No Windows:

```bash
netstat -ano | findstr :4174
```

### Alteração nos textos da interface

Os testes de navegador podem localizar elementos por seus textos visíveis.

Ao alterar títulos ou botões, revise também os seletores utilizados no teste.

Exemplos de textos que podem ser utilizados:

```text
Prêmio total
Copiar todos
Classificação geral
Conferência de palpites
```

Sempre que possível, prefira seletores estáveis, como atributos dedicados a testes, para reduzir falhas causadas apenas por mudanças de texto.

### Falha no build

Quando o teste de navegador falhar antes de abrir a aplicação, execute o build separadamente:

```bash
npm run build
```

Corrija primeiro erros de TypeScript, importações, variáveis de ambiente ou configuração do Vite.

## Inclusão de novos testes

Novos testes devem ser adicionados quando houver alterações em:

* regras de pontuação;
* critérios de desempate;
* bloqueio dos palpites;
* normalização dos documentos;
* estrutura de partidas ou participantes;
* sincronização com fontes externas;
* cálculo da premiação;
* fluxos principais da interface.

Cada correção de bug relevante deve, sempre que possível, incluir um teste que reproduza o comportamento incorreto e impeça sua reintrodução.
