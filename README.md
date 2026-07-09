# Prazo Certo — Controle de Validade (PWA)

Aplicativo web progressivo (PWA) para controle de validade e estoque de um minimercado autônomo de condomínio. Funciona no navegador, pode ser **instalado na tela inicial** do Android e do iPhone, e continua abrindo (com os dados já salvos) mesmo sem internet.

## O que tem no projeto

```
prazo-certo-pwa/
├─ index.html          → página única do app (shell)
├─ manifest.webmanifest→ nome, ícones, cores, modo "standalone"
├─ sw.js                → service worker (cache offline)
├─ offline.html         → tela exibida quando não há internet nem cache
├─ vercel.json          → cabeçalhos HTTP recomendados para PWA na Vercel
├─ css/styles.css       → estilos (100% responsivo)
├─ js/app.js            → toda a lógica: dashboard, produtos, estoque, validade
└─ icons/, splash/      → ícone do app e telas de carregamento (iOS)
```

Não há build, framework ou dependências — é **HTML, CSS e JavaScript puros**. Isso significa zero risco de erro de build: a Vercel publica os arquivos exatamente como estão.

Os dados (produtos e movimentações) ficam salvos no `localStorage` do navegador, ou seja, **por dispositivo/navegador**. Isso é suficiente para operar em um único caixa/tablet do minimercado. Se no futuro você quiser que vários dispositivos vejam o mesmo estoque em tempo real, será necessário adicionar um banco de dados (posso te ajudar com isso depois).

---

## 1. Testar localmente antes de publicar (opcional, mas recomendado)

Service workers só funcionam em `http://` ou `https://`, não em arquivo aberto direto (`file://`). Para testar no seu computador:

```bash
cd prazo-certo-pwa
npx serve .
```

Abra o endereço que aparecer no terminal (algo como `http://localhost:3000`). Teste o app, o botão "Instalar" e o funcionamento offline (abra o DevTools → aba **Application** → marque **Offline** e recarregue).

---

## 2. Colocar o projeto no GitHub

1. Crie uma conta gratuita em [github.com](https://github.com) (se ainda não tiver).
2. Crie um repositório novo, por exemplo `prazo-certo` (pode ser público ou privado).
3. No seu computador, dentro da pasta `prazo-certo-pwa`:
   ```bash
   git init
   git add .
   git commit -m "Primeira versão do Prazo Certo"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/prazo-certo.git
   git push -u origin main
   ```

*(Se preferir não usar linha de comando, você pode arrastar a pasta inteira na interface web do GitHub em "uploading an existing file", ou usar o GitHub Desktop.)*

---

## 3. Publicar gratuitamente na Vercel

1. Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita — o jeito mais simples é clicar em **"Continue with GitHub"** e autorizar o acesso.
2. No painel da Vercel, clique em **"Add New..." → "Project"**.
3. Selecione o repositório `prazo-certo` que você acabou de subir e clique em **"Import"**.
4. Na tela de configuração:
   - **Framework Preset:** deixe como `Other` (a Vercel detecta automaticamente que é um site estático).
   - **Build Command:** deixe em branco.
   - **Output Directory:** deixe em branco (raiz do projeto).
5. Clique em **"Deploy"**.
6. Em cerca de 30 a 60 segundos a Vercel mostra "Congratulations!" com o link público, algo como:
   `https://prazo-certo.vercel.app`

Esse é o link que você pode compartilhar com seus clientes. Qualquer novo `git push` para o branch `main` gera um novo deploy automático.

### Alternativa sem GitHub (via terminal)

```bash
npm i -g vercel
cd prazo-certo-pwa
vercel login
vercel --prod
```

A CLI pergunta algumas coisas (nome do projeto, diretório) — aceite os padrões e ao final ela devolve o link público.

---

## 4. Colocar um domínio próprio (opcional)

No painel do projeto na Vercel → aba **"Domains"** → adicione seu domínio (ex.: `mercadinho.suaempresa.com.br`) e siga as instruções de DNS que a Vercel mostra (é gratuito, você só paga o domínio em si, se ainda não tiver um).

---

## 5. Instalar o app no celular

**Android (Chrome):**
1. Abra o link publicado.
2. Um banner "Instalar" aparece automaticamente no topo do app (ou toque nos três pontinhos do navegador → "Instalar aplicativo" / "Adicionar à tela inicial").

**iPhone (Safari — obrigatório ser o Safari, não funciona no Chrome do iOS):**
1. Abra o link publicado no Safari.
2. Toque no ícone de compartilhar (quadrado com seta para cima).
3. Toque em **"Adicionar à Tela de Início"**.
4. O ícone do Prazo Certo aparece na tela inicial, abrindo em tela cheia, sem a barra do navegador, com a splash screen de carregamento.

**Computador (Chrome/Edge):**
1. Abra o link.
2. Clique no ícone de instalação que aparece na barra de endereço (ou no banner "Instalar" dentro do app).

---

## 6. Publicando atualizações depois

Sempre que você editar o app e quiser publicar uma nova versão:

1. Abra `sw.js` e mude o número da versão no topo, por exemplo:
   ```js
   var CACHE_VERSION = "prazo-certo-v2";
   ```
   Isso é importante — sem mudar essa linha, dispositivos que já instalaram o app podem continuar vendo a versão antiga em cache por um tempo.
2. Faça commit e `git push` (ou `vercel --prod` de novo). A Vercel publica a nova versão automaticamente.

---

## 7. Checklist de qualidade do PWA

Depois de publicado, você pode auditar o app gratuitamente:
1. Abra o link publicado no Chrome (computador).
2. `F12` → aba **Lighthouse** → categoria **Progressive Web App** → **Analyze page load**.
3. O relatório confirma: instalável, ícone correto, funciona offline, responsivo.

---

Qualquer ajuste de cores, textos, categorias de produto ou regras de alerta fica em `js/app.js` (constantes `CATEGORIAS`, `UNIDADES`, `STATUS_META` no topo do arquivo) e em `css/styles.css` (bloco `:root` com as variáveis de cor).
