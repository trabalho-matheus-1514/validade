# Prazo Certo — Controle de Validade (PWA)

Aplicativo web progressivo (PWA) para controle de validade e estoque de minimercados autônomos de condomínio. Funciona no navegador, pode ser **instalado na tela inicial** do Android e do iPhone, continua abrindo (com os dados já salvos) mesmo sem internet, e suporta **múltiplos estabelecimentos numa mesma conta** — cada um com seus próprios produtos, estoque e movimentações, sem misturar dados entre eles.

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

## Banco de dados compartilhado (Supabase) — multi-estabelecimento

Por padrão o app funciona 100% local (por aparelho). Configurando o Supabase, o app passa a suportar **múltiplos estabelecimentos por conta**, cada um com seus próprios produtos, estoque e movimentações, sincronizados em tempo real entre todos os dispositivos.

> ⚠️ **Se você já tinha o Supabase configurado de uma versão anterior deste app (sem "estabelecimentos"), esta é uma migração obrigatória, não incremental.** O schema mudou (nova tabela `stores`, nova coluna `store_id`, novas políticas de RLS que agora exigem login) e o app agora faz **login anônimo automaticamente**. Se você pulou os passos 1 e 2 abaixo, o app roda em modo "supabase" mas todas as chamadas falham silenciosamente (RLS bloqueia tudo, ou a tabela `stores` nem existe) — o sintoma é exatamente **"parece que não sincroniza"**: o cabeçalho fica em "Sem conexão" e os dados somem ou não aparecem em outro aparelho. Siga os passos na ordem.

### O que foi criado/alterado

| Arquivo | Função |
|---|---|
| `supabase/schema.sql` | Cria as tabelas `stores`, `products`, `movements`, políticas de RLS **baseadas em login** e habilita o Realtime. Cole no SQL Editor do Supabase. |
| `js/supabase-config.js` | Onde você cola a URL e a chave do seu projeto (sem mudanças de formato). |

**Estrutura do banco:**
- **`stores`** — um estabelecimento por linha: `user_id` (dono, preenchido automaticamente pelo login), `name`, `icon` (emoji), `color`, `created_at`.
- **`products`** — agora tem `store_id` (a qual estabelecimento pertence), além dos campos de antes.
- **`movements`** — também tem `store_id`, além de referenciar o produto.

**Autenticação:** o app usa **login anônimo do Supabase** — cada aparelho recebe uma identidade real (`auth.uid()`) automaticamente, sem tela de cadastro. É essa identidade que o RLS usa para garantir que ninguém acesse estabelecimentos de outra conta, mesmo alterando requisições manualmente. Trade-off importante: por enquanto essa identidade fica presa ao navegador/aparelho — se o usuário limpar os dados do site ou trocar de aparelho, ele "perde" o acesso à conta anônima (os dados continuam no banco, só não tem como provar que são dele). Pra um único dono de minimercado usando sempre o mesmo celular/computador isso não costuma ser problema; quando fizer sentido evoluir para login por e-mail/senha "de verdade", dá para migrar sem perder dados (o Supabase permite "promover" uma conta anônima) — me avise quando quiser isso.

**Como a sincronização funciona:** ao trocar de estabelecimento no seletor, o app troca a inscrição do Realtime para escutar só aquele `store_id` — nunca mistura eventos de estabelecimentos diferentes, mesmo que você tenha vários abertos em aparelhos distintos.

### Passo a passo (siga na ordem — principalmente se está migrando de uma versão anterior)

1. **Habilite o login anônimo primeiro**: Supabase Dashboard → **Authentication → Sign In / Providers → Anonymous** → ative "Allow anonymous sign-ins". **Sem este passo, nada mais funciona.**
2. **Rode o schema novo**: **SQL Editor → New query**, cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**. Se você já tinha as tabelas `products`/`movements` de uma versão anterior, o script vai falhar ao criar `store_id` como `not null` nelas se já houver linhas antigas — nesse caso, o mais simples para uma base que ainda é só de teste é apagar as tabelas antigas antes (`drop table if exists movements; drop table if exists products;` no SQL Editor) e então rodar o `schema.sql` inteiro. Se você já tem dados reais de clientes que precisa preservar, me avise antes de rodar — te ajudo a migrar sem perder nada.
3. **Confirme o Realtime**: **Database → Replication**, confirme que `stores`, `products` e `movements` aparecem marcados na publicação `supabase_realtime`.
4. **Credenciais**: **Project Settings → API** → copie **Project URL** e a chave **anon public** para `js/supabase-config.js` (mesmo formato de antes).
5. **Publique** (`git add . && git commit -m "Multi-estabelecimento" && git push`).
6. **Force a atualização do app já instalado**: como o `sw.js` também mudou de versão, em qualquer aparelho que já tinha o app aberto antes, force um refresh (o app detecta e recarrega sozinho na maioria dos casos — se não recarregar em alguns segundos, feche e abra de novo).
7. Abra o app: no primeiro acesso, ele cria sozinho um estabelecimento chamado "Meu Estabelecimento". O cabeçalho deve mostrar **"Sincronizado"**. Crie um segundo estabelecimento pelo seletor, cadastre um produto nele, e confirme em outro aparelho/aba que cada um mostra só os produtos do seu próprio estabelecimento.

**Se aparecer "Sem conexão":** abra o Console do navegador (F12) — o erro mais comum é `relation "stores" does not exist` (esqueceu o passo 2) ou `Anonymous sign-ins are disabled` (esqueceu o passo 1).

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

- **v6** — Arquitetura multi-estabelecimento: tela "Meus Estabelecimentos" (criar/editar/excluir, ícone e cor), seletor no cabeçalho com troca instantânea (sem reload), isolamento completo de dados por `store_id`, login anônimo automático via Supabase Auth, RLS real por usuário, Realtime reconectando com filtro por estabelecimento a cada troca. `CACHE_VERSION` do service worker atualizado para `prazo-certo-v5`. **Migração de schema obrigatória para quem já usava o Supabase** — veja a seção acima.
- **v3–v5** — Correção de layout mobile (safe-area/dvh) e do cache do service worker; banco de dados compartilhado via Supabase.
- **v2** — Cadastro por câmera (escaneamento de código de barras).
- **v1** — Versão inicial: dashboard, cadastro, estoque, validade, PWA instalável.
