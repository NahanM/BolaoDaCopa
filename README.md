# Bolão da Copa 2026

Aplicação web desenvolvida para organizar um bolão entre participantes durante a Copa do Mundo de 2026.

O sistema centraliza partidas, palpites, classificação, premiação e conferência dos resultados em um único ambiente. Os participantes acessam a aplicação com uma Conta Google, registram seus palpites e acompanham a evolução do ranking conforme os resultados das partidas são atualizados.

Além da experiência dos participantes, o projeto possui um painel administrativo para gerenciamento das partidas, resultados, participantes e configurações do bolão.

## Status

Concluído. Utilizado durante a Copa do Mundo de 2026 por cerca de 15 pessoas, com 104 partidas e mais de 1.000 palpites registrados, substituindo as planilhas usadas anteriormente. Hoje o site segue no ar apenas para visualização.

## Aplicação

A aplicação está disponível em:

https://bolaodacopa-beige.vercel.app

![Tela do Bolão da Copa 2026](docs/print.png)

## Objetivo do projeto

Antes da aplicação, o controle dos palpites, partidas e pontuações era realizado manualmente por meio de planilhas e mensagens.

O projeto foi criado para substituir parte desse processo por uma aplicação centralizada, permitindo:

* registrar os palpites dos participantes;
* bloquear alterações após o início das partidas;
* calcular automaticamente a pontuação;
* atualizar a classificação;
* acompanhar a premiação;
* permitir a conferência pública dos palpites;
* reduzir o trabalho manual de organização do bolão.

## Funcionalidades

### Participantes

* autenticação com Conta Google;
* visualização das partidas;
* registro e atualização de palpites;
* bloqueio automático dos palpites após o início da partida;
* filtros para localização das partidas;
* compartilhamento de palpites pelo WhatsApp;
* cópia dos palpites registrados;
* classificação geral atualizada;
* conferência dos palpites dos demais participantes;
* acompanhamento da premiação;
* escolha da seleção campeã, quando habilitada.

### Administração

* cadastro e edição de partidas;
* lançamento e atualização de resultados;
* sincronização de partidas por meio de fontes externas;
* cadastro manual de participantes;
* ajuste manual de pontuação;
* configuração do palpite de campeão;
* ferramentas de manutenção e migração de dados.

## Regras de pontuação

A pontuação é calculada automaticamente de acordo com o resultado de cada partida:

* **3 pontos:** acerto do placar exato;
* **1 ponto:** acerto do vencedor ou do empate;
* **0 pontos:** resultado incorreto.

Partidas ainda não finalizadas não entram no cálculo da classificação.

Em caso de empate na pontuação total, a quantidade de placares exatos é utilizada como critério de desempate.

### Bolsa Campeão

No mata-mata, cada participante pode escolher uma seleção entre as liberadas pelo administrador. A escolha é feita uma única vez e não pode ser alterada.

O bônus padrão é de 30 pontos, dividido entre quem escolher o campeão. O sistema registra as escolhas, mas não calcula o bônus. Os pontos entram na classificação por ajuste manual do administrador.

## Tecnologias utilizadas

### Frontend

* React 19;
* TypeScript 5.8;
* Vite 6;
* Tailwind CSS 4;
* Motion;
* Lucide.

### Autenticação e banco de dados

* Firebase Authentication;
* Cloud Firestore;
* Firestore Security Rules.

### Infraestrutura

* Vercel;
* Vercel Serverless Functions.

### Testes e qualidade

* Playwright para testes em navegador;
* `tsx` e `node:assert` para testes de regras de negócio e de dados;
* TypeScript para verificação de tipos.

## Arquitetura

```text
Participante ou administrador
              ↓
       Aplicação React
       ↓             ↓
   Firebase      Funções da pasta api/
                 ↓                  ↓
               ESPN            OpenFootball
             principal           reserva
```

O React usa o Firebase Authentication para o login com Conta Google e o Cloud Firestore para partidas, participantes, palpites e configurações.

As funções da pasta `api` buscam as partidas na ESPN e usam o OpenFootball como reserva. O painel administrativo chama essas funções e salva o resultado no Firestore.

## Decisões técnicas

* **Regras de segurança do Firestore:** a autorização fica no banco, não na interface. O `firestore.rules` define quem pode escrever e valida o formato de cada documento.
* **Fallback ESPN → OpenFootball:** quando a ESPN falha ou não retorna partidas válidas, a API consulta o OpenFootball e devolve os dados no mesmo formato.
* **Bloqueio do palpite:** o palpite travava quando a partida começava. A interface fazia o bloqueio e as regras do Firestore conferiam o horário do servidor.
* **Modo encerrado:** com `VITE_BOLAO_ENCERRADO="true"`, o site fica só para consulta e apenas o administrador consegue entrar. As regras do Firestore negam qualquer outra escrita.

## Estrutura do projeto

```text
api/
  Funções serverless executadas pela Vercel.

docs/
  Documentação técnica e operacional.

public/
  Arquivos públicos da aplicação.

scripts/
  Scripts de validação, manutenção e testes.

src/
  Código principal da aplicação React.

firestore.rules
  Regras de autorização e segurança do Firestore.

firebase.json
  Configuração utilizada pelo Firebase CLI.

vite.config.ts
  Configuração do Vite e dos plugins utilizados.

tsconfig.json
  Configuração do TypeScript.
```

## Executando o projeto localmente

### Pré-requisitos

Para executar o projeto, é necessário ter instalado:

* Node.js 20.19+ ou 22.12+;
* npm;
* Git.

### 1. Clone o repositório

```bash
git clone https://github.com/NahanM/BolaoDaCopa.git
```

Entre na pasta do projeto:

```bash
cd BolaoDaCopa
```

### 2. Instale as dependências

```bash
npm ci
```

### 3. Configure as variáveis de ambiente

Crie o arquivo `.env.local` a partir do exemplo:

```bash
cp .env.example .env.local
```

No PowerShell, use `Copy-Item .env.example .env.local`.

Sem credenciais reais, a interface abre, mas sem partidas ou participantes, e o login e a gravação de dados não funcionam.

Para usar esses recursos, é necessário um projeto Firebase próprio:

1. crie um projeto no [console do Firebase](https://console.firebase.google.com);
2. ative o login com Google no Authentication e crie um banco no Cloud Firestore;
3. registre um app web e substitua os valores do `.env.local` pelas credenciais dele;
4. coloque seu e-mail em `VITE_ADMIN_EMAILS` e na função `adminEmails()` do `firestore.rules`, pois somente administradores podem criar participantes;
5. publique as regras no seu projeto:

```bash
npx firebase-tools deploy --only firestore:rules --project ID_DO_SEU_PROJETO
```

As regras atuais são as do modo encerrado: somente o administrador grava dados.

### 4. Inicie a aplicação

```bash
npm run dev
```

A aplicação ficará disponível, por padrão, em:

```text
http://localhost:3000
```

O banco começa sem partidas: elas são cadastradas ou sincronizadas pelo painel administrativo. A função da pasta `api` não é executada pelo `npm run dev`, então a sincronização só funciona na Vercel ou localmente com `npx vercel dev`.

## Comandos disponíveis

### Ambiente de desenvolvimento

```bash
npm run dev
```

Inicia o servidor de desenvolvimento.

### Build de produção

```bash
npm run build
```

Gera os arquivos otimizados para produção na pasta `dist`.

### Visualização do build

```bash
npm run preview
```

Executa localmente o build gerado pelo Vite.

### Verificação do TypeScript

```bash
npm run typecheck
```

Verifica erros de tipagem sem gerar um novo build.

### Validação completa

```bash
npm run test:all
```

Executa as principais verificações automatizadas, incluindo testes, TypeScript e build.

### Testes no navegador

```bash
npx playwright install chromium firefox
npm run test:browsers
```

Executa os testes automatizados da aplicação em navegadores. A instalação dos navegadores só é necessária na primeira execução.

A descrição completa dos testes está disponível em:

[docs/testing.md](docs/testing.md)

## Deploy

O frontend e as funções serverless da pasta `api` são publicados pela Vercel.

As regras do Cloud Firestore são publicadas separadamente:

```bash
npm run deploy:rules
```

## Documentação

Mais detalhes sobre a implementação estão disponíveis em:

* [Arquitetura do projeto](docs/architecture.md)
* [Modelo de dados](docs/data-model.md)
* [Manutenção e administração](docs/maintenance.md)
* [Testes do projeto](docs/testing.md)

## Autor

Desenvolvido por **Nahan Miguel Barbosa**.

[www.linkedin.com/in/nahan-miguel-barbosa](https://www.linkedin.com/in/nahan-miguel-barbosa)
