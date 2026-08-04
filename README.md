# Bolão da Copa 2026

Aplicação web desenvolvida para organizar um bolão entre participantes durante a Copa do Mundo de 2026.

O sistema centraliza partidas, palpites, classificação, premiação e conferência dos resultados em um único ambiente. Os participantes acessam a aplicação com uma Conta Google, registram seus palpites e acompanham a evolução do ranking conforme os resultados das partidas são atualizados.

Além da experiência dos participantes, o projeto possui um painel administrativo para gerenciamento das partidas, resultados, participantes e configurações do bolão.

## Aplicação

A aplicação está disponível em:

https://bolaodacopa-beige.vercel.app

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

## Tecnologias utilizadas

### Frontend

* React;
* TypeScript;
* Vite;
* Tailwind CSS.

### Autenticação e banco de dados

* Firebase Authentication;
* Cloud Firestore;
* Firestore Security Rules.

### Infraestrutura

* Vercel;
* Vercel Serverless Functions.

### Testes e qualidade

* Playwright;
* TypeScript;
* ESLint;
* testes automatizados de regras e funcionalidades.

## Arquitetura

```text
Participante ou administrador
            ↓
Aplicação React com TypeScript
            ↓
 ┌─────────────────────────────┐
 │ Firebase Authentication     │
 │ Cloud Firestore             │
 └─────────────────────────────┘
            ↓
Funções serverless da Vercel
            ↓
Fontes externas de partidas
```

O frontend é responsável pela interface, pelos fluxos de autenticação e pela interação com os dados do bolão.

O Firebase Authentication controla o acesso por Conta Google, enquanto o Cloud Firestore armazena partidas, participantes, palpites e configurações.

As funções serverless hospedadas na Vercel são utilizadas para integração com fontes externas de dados esportivos.

Mais detalhes estão disponíveis na documentação:

* [Arquitetura do projeto](docs/architecture.md)
* [Modelo de dados](docs/data-model.md)
* [Manutenção e administração](docs/maintenance.md)
* [Testes do projeto](docs/testing.md)

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

* Node.js 20.19 ou superior;
* npm;
* Git.

Verifique as versões instaladas:

```bash
node --version
npm --version
git --version
```

### 1. Clone o repositório

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta do projeto:

```bash
cd bolaodacopa
```

### 2. Instale as dependências

```bash
npm ci
```

O comando `npm ci` utiliza as versões registradas no arquivo `package-lock.json`, garantindo uma instalação reproduzível.

Durante o desenvolvimento, use `npm install` quando precisar adicionar, remover ou atualizar dependências.

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` com base no `.env.example`.

A aplicação principal usa o projeto Firebase atual:

```text
projectId: bolaodacopa-90a57
databaseId: (default)

VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="bolaodacopa-90a57.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="bolaodacopa-90a57"
VITE_FIREBASE_STORAGE_BUCKET="bolaodacopa-90a57.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
VITE_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID"
VITE_FIREBASE_DATABASE_ID="(default)"

VITE_ADMIN_EMAILS="admin@example.com"
```

### 4. Inicie a aplicação

```bash
npm run dev
```

A aplicação ficará disponível, por padrão, em:

```text
http://localhost:3000
```

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

Verifica e gera os arquivos otimizados para produção.

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
npm run test:browsers
```

Executa os testes automatizados da aplicação em navegadores.

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
