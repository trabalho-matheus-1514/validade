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
├─ css/styles.css       → estilos (100% responsivo, com safe-area para notch)
├─ js/app.js            → toda a lógica: dashboard, produtos, estoque, validade, scanner, Supabase
├─ js/supabase-config.js→ suas credenciais do Supabase (opcional — veja seção abaixo)
├─ supabase/schema.sql  → script para criar as tabelas no Supabase
└─ icons/, splash/      → ícone do app e telas de carregamento (iOS)
```

Não há build, framework ou dependências — é **HTML, CSS e JavaScript puros**. Isso significa zero risco de erro de build: a Vercel publica os arquivos exatamente como estão.

### Cadastro por câmera (escaneamento de código de barras)

Na aba **Produtos** (e também dentro do formulário de produto) há um botão **"Escanear código de barras"**. Ele:
1. Abre a câmera do celular — usa a `BarcodeDetector` nativa quando o navegador suporta (Chrome/Edge Android e desktop); em navegadores sem suporte (principalmente **Safari/iPhone**), carrega automaticamente a biblioteca gratuita `html5-qrcode` de um CDN só quando o botão é usado — quem não escaneia não baixa nada a mais.
2. Ao identificar o código, consulta a Open Food Facts e preenche nome, marca, categoria e imagem (quando disponíveis) — sobrando para o operador apenas informar **validade** e **quantidade**.
3. Caso o produto não seja encontrado, a câmera fecha e o formulário fica pronto para preenchimento manual, sem travar o fluxo.
4. Mensagens amigáveis cobrem os casos de permissão negada, ausência de câmera, navegador sem suporte e falta de conexão.

Importante: a leitura por câmera só funciona em **HTTPS** (a Vercel já publica assim por padrão) — em `http://` puro ela é bloqueada pelo próprio navegador.

Os dados (produtos e movimentações) ficam salvos no `localStorage` do navegador — **a menos que você configure o Supabase** (veja a seção abaixo), caso em que passam a ficar num banco de dados compartilhado, sincronizado em tempo real entre todos os aparelhos.

---

## Banco de dados compartilhado (Supabase)

Por padrão o app funciona 100% local (por aparelho). Para que **todos os dispositivos vejam os mesmos produtos** — um cadastro feito no celular do estoque aparece automaticamente no computador do caixa, por exemplo — configure o Supabase (gratuito). Se você pular esta seção, nada quebra: o app continua funcionando como antes, só que sem sincronização entre aparelhos.

### O que foi criado

| Arquivo | Função |
|---|---|
| `supabase/schema.sql` | Cria as tabelas `products` e `movements`, as políticas de acesso (RLS) e habilita o Realtime. Cole no SQL Editor do Supabase. |
| `js/supabase-config.js` | Onde você cola a URL e a chave do seu projeto. |

**Estrutura do banco:**
- **`products`** — um produto por linha: `barcode`, `name`, `category`, `brand`, `unit`, `stock`, `min_stock`, `manufacture_date`, `expiry_date`, `supplier`, `notes`, `image`, `created_at`, mais o `id` (gerado automaticamente).
- **`movements`** — histórico de estoque: `product_id` (referencia `products.id`, apagado em cascata se o produto for excluído), `product_name`, `type` (`entrada`/`saida`/`ajuste`), `quantity`, `previous_stock`, `new_stock`, `note`, `created_at`.

**Como a sincronização funciona:** cada ação (cadastrar, editar, excluir produto, registrar movimento) grava direto no Supabase. O app fica inscrito num canal Realtime dessas duas tabelas — quando qualquer dispositivo grava algo, o Supabase avisa todos os outros dispositivos conectados na hora, e a tela é atualizada sozinha (sem precisar recarregar a página). Se você estiver com um formulário aberto digitando algo, o app espera você terminar antes de atualizar a tela, para não apagar o que você está escrevendo.

**Sobre segurança (leia antes de usar com clientes):** para esta primeira versão, o banco fica com acesso público de leitura/gravação — qualquer pessoa que tiver a URL e a chave "anon" do seu projeto consegue ler e alterar os dados. Isso é seguro no sentido de que ninguém consegue acessar o painel administrativo do seu Supabase com essa chave, mas os *dados* (produtos, estoque) não têm senha. Para um único minimercado interno isso costuma ser aceitável; se quiser reforçar depois, dá para adicionar login (Supabase Auth) e trocar as políticas do `schema.sql` — me avise quando quiser evoluir isso.

### Passo a passo para configurar

1. **Crie um projeto gratuito**: acesse [supabase.com](https://supabase.com) → "Start your project" → crie uma organização e um novo projeto (escolha uma senha de banco forte e guarde-a, e uma região perto de você/dos seus clientes, ex.: São Paulo).
2. **Rode o schema**: no painel do projeto, abra **SQL Editor** → **New query**, cole todo o conteúdo do arquivo `supabase/schema.sql` deste projeto, e clique em **Run**.
3. **Confirme o Realtime**: vá em **Database → Replication**, clique na publicação `supabase_realtime` e confirme que as tabelas `products` e `movements` aparecem marcadas (o script do passo 2 já tenta habilitar isso sozinho, mas vale conferir).
4. **Pegue suas credenciais**: vá em **Project Settings → API**. Copie o **Project URL** e a chave em **anon public**.
5. **Cole no projeto**: abra `js/supabase-config.js` e preencha:
   ```js
   window.PRAZO_CERTO_CONFIG = {
     SUPABASE_URL: "https://xxxxxxxx.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOi..."
   };
   ```
6. **Publique** (`git add . && git commit -m "Configurar Supabase" && git push`) — a Vercel republica sozinha.
7. Abra o app publicado: no cabeçalho deve aparecer **"Sincronizado"** (ícone de nuvem verde). Cadastre um produto em um aparelho e confira que ele aparece automaticamente em outro, sem recarregar a página.

Se aparecer **"Sem conexão"** no lugar de "Sincronizado", confira se a URL/chave em `js/supabase-config.js` estão corretas e se o schema foi executado sem erros.

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

---

## Changelog

- **v3** — Corrigido corte de layout em celulares (bug real: o container principal não estava recebendo o padding de safe-area — corrigido; troca de `vh` por `dvh`/`svh`, `env(safe-area-inset-*)` completo nos 4 lados). Banco de dados compartilhado via Supabase (sincronização em tempo real entre dispositivos), com modo local automático quando não configurado. `CACHE_VERSION` do service worker atualizado para `prazo-certo-v3`.
- **v2** — Adicionado cadastro por câmera (escaneamento de código de barras com `BarcodeDetector` nativo + fallback `html5-qrcode`), preenchimento automático de imagem do produto e miniaturas na listagem. `CACHE_VERSION` do service worker atualizado para `prazo-certo-v2`.
- **v1** — Versão inicial: dashboard, cadastro, estoque, validade, PWA instalável.
