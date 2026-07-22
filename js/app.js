(function () {
  "use strict";

  /* ================================================================ */
  /* Constantes                                                        */
  /* ================================================================ */

  var STORAGE_KEY = "prazoCertoData";
  var STORES_KEY = "prazoCertoStores";
  var ACTIVE_STORE_KEY = "prazoCertoActiveStoreId";

  var CATEGORIAS = ["Bebidas", "Snacks", "Laticínios", "Padaria", "Higiene", "Limpeza", "Congelados", "Doces", "Mercearia", "Outros"];
  var UNIDADES = ["un", "kg", "g", "L", "ml", "cx", "pct", "dz"];

  var STORE_ICONS = ["🏪", "🏬", "🏢", "🛒", "🥖", "☕", "🧊", "🍬", "🧴", "🏠"];
  var STORE_COLORS = ["#2f6f5e", "#1f4e42", "#b5540f", "#c98a12", "#2f6f9e", "#6f4fa0", "#c8433c", "#2f8f5b", "#5b6b66", "#a34e7e"];

  var STATUS_META = {
    vencido: { label: "Vencido", color: "var(--red)", bg: "var(--red-bg)", icon: "alert" },
    critico: { label: "Vence em breve", color: "var(--amber-strong)", bg: "var(--amber-bg)", icon: "clock" },
    atencao: { label: "Atenção", color: "var(--amber)", bg: "var(--amber-bg)", icon: "clock" },
    ok: { label: "Dentro da validade", color: "var(--green)", bg: "var(--green-bg)", icon: "check" }
  };

  /* ================================================================ */
  /* Banco de dados: Supabase (compartilhado) ou local (localStorage)  */
  /* Se js/supabase-config.js não estiver preenchido, o app funciona   */
  /* exatamente como antes (dados só no aparelho) — nada quebra.       */
  /* ================================================================ */

  var SUPA_CFG = window.PRAZO_CERTO_CONFIG || {};
  var DB_MODE = (SUPA_CFG.SUPABASE_URL && SUPA_CFG.SUPABASE_ANON_KEY && window.supabase) ? "supabase" : "local";
  var supa = DB_MODE === "supabase" ? window.supabase.createClient(SUPA_CFG.SUPABASE_URL, SUPA_CFG.SUPABASE_ANON_KEY) : null;
  var connStatus = "connecting"; // connecting | online | offline | local
  var currentUserId = null; // preenchido após login anônimo (modo supabase) ou fixo em modo local
  var productsChannel = null;
  var movementsChannel = null;

  /* ================================================================ */
  /* Ícones (SVG inline, sem dependência externa)                      */
  /* ================================================================ */

  var ICONS = {
    dashboard: '<path d="M3 3h8v8H3z"/><path d="M13 3h8v5h-8z"/><path d="M13 12h8v9h-8z"/><path d="M3 15h8v6H3z"/>',
    package: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    swap: '<path d="M7 3l-4 4 4 4"/><path d="M3 7h13"/><path d="M17 21l4-4-4-4"/><path d="M21 17H8"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    barcode: '<path d="M4 5v14M8 5v14M11 5v14M15 5v14M19 5v14"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    down: '<path d="M12 5v14M5 12l7 7 7-7"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2-2z"/>',
    alert: '<path d="M12 2l10 18H2z"/><path d="M12 9v5M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
    rotate: '<path d="M3 12a9 9 0 109-9M3 12V4M3 12h8"/>',
    inbox: '<path d="M3 12h5l2 3h4l2-3h5"/><path d="M5.5 5h13L21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6z"/>',
    loader: '<path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    tag: '<path d="M20.6 12.6L12 21.2 2.8 12 2.8 2.8 12 2.8 20.6 11.4a2 2 0 010 1.2z"/><circle cx="7" cy="7" r="1.2"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    close: '<path d="M18 6L6 18M6 6l12 12"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5-4 4-2-2-5 5"/>',
    cloud: '<path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.5A4.5 4.5 0 0117.5 18H7z"/>',
    cloudOff: '<path d="M3 3l18 18"/><path d="M9.5 8.5A5 5 0 0116.6 10.5 4.5 4.5 0 0117.5 19H8"/><path d="M6 18a4 4 0 01-1-7.87"/>',
    sync: '<path d="M4 12a8 8 0 0114-5.3M4 4v4h4"/><path d="M20 12a8 8 0 01-14 5.3M20 20v-4h-4"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v10a1 1 0 001 1h14a1 1 0 001-1V9"/><path d="M9 20v-6h6v6"/><path d="M3 9h18"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V21a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H3a2 2 0 110-4h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.6V3a2 2 0 114 0v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.6 1H21a2 2 0 110 4h-.2a1.7 1.7 0 00-1.5 1z"/>'
  };

  function icon(name, cls) {
    var body = ICONS[name] || "";
    return '<svg class="ic ' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";
  }

  /* ================================================================ */
  /* Helpers                                                           */
  /* ================================================================ */

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function todayStart() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function parseDateStr(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }

  function daysUntil(dateStr) {
    var d = parseDateStr(dateStr);
    if (!d) return null;
    return Math.round((d.getTime() - todayStart().getTime()) / 86400000);
  }

  function statusFromDays(days) {
    if (days === null) return "ok";
    if (days < 0) return "vencido";
    if (days <= 7) return "critico";
    if (days <= 30) return "atencao";
    return "ok";
  }

  function formatDate(dateStr) {
    var d = parseDateStr(dateStr);
    if (!d) return "—";
    return d.toLocaleDateString("pt-BR");
  }

  function formatDateTime(ts) {
    return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function daysLabel(days) {
    if (days === null) return "sem data";
    if (days < 0) return "vencido há " + Math.abs(days) + " dia" + (Math.abs(days) === 1 ? "" : "s");
    if (days === 0) return "vence hoje";
    return "vence em " + days + " dia" + (days === 1 ? "" : "s");
  }

  function badge(days, small) {
    var status = statusFromDays(days);
    var meta = STATUS_META[status];
    return (
      '<span class="pc-badge" style="color:' + meta.color + ";background:" + meta.bg + '">' +
      icon(meta.icon) + daysLabel(days) +
      "</span>"
    );
  }

  function statOk(products) {
    var d = daysUntil ? true : true;
    return d;
  }

  /* ================================================================ */
  /* Estado + persistência                                             */
  /* ================================================================ */

  var state = {
    stores: [],
    activeStoreId: null,
    storeModal: null,       // null | 'new' | store object em edição
    confirmDeleteStore: null,
    storeMenuOpen: false,
    showStoresScreen: false,
    products: [],
    movements: [],
    tab: "dashboard",
    productModal: null,
    moveModal: null,
    confirmDelete: null,
    validadeFilter: { nome: "", barcode: "", categoria: "todas", marca: "todas", status: "todos" },
    produtosFilter: { q: "", categoria: "todas" },
    movFilter: { q: "", type: "todos" },
    deferredInstallPrompt: null,
    installBannerDismissed: false,
    pendingAutoLookup: null
  };

  /* ---- Local mode: guarda TODOS os produtos/movimentos de TODOS os
     estabelecimentos; state.products/state.movements sempre refletem
     só o estabelecimento ativo, filtrado em memória. ---- */
  var localProductsAll = [];
  var localMovementsAll = [];

  function loadLocalAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        localProductsAll = parsed.products || [];
        localMovementsAll = parsed.movements || [];
      }
    } catch (e) {
      console.error("Falha ao carregar dados salvos", e);
    }
  }

  function saveLocalAll() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ products: localProductsAll, movements: localMovementsAll }));
    } catch (e) {
      console.error("Falha ao salvar dados", e);
      showToast("Não foi possível salvar as alterações neste dispositivo.");
    }
  }

  function refilterLocalToActiveStore() {
    state.products = localProductsAll.filter(function (p) { return p.storeId === state.activeStoreId; });
    state.movements = localMovementsAll.filter(function (m) { return m.storeId === state.activeStoreId; });
  }

  function loadLocalStores() {
    try {
      var raw = localStorage.getItem(STORES_KEY);
      state.stores = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.stores = [];
    }
  }

  function saveLocalStores() {
    try {
      localStorage.setItem(STORES_KEY, JSON.stringify(state.stores));
    } catch (e) { /* ignora */ }
  }

  /* ---- Cache local (usada só como reserva offline quando DB_MODE === "supabase") ---- */
  function cacheLocalSnapshot() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var all = raw ? JSON.parse(raw) : { products: [], movements: [] };
      var others = (all.products || []).filter(function (p) { return p.storeId !== state.activeStoreId; });
      var othersMov = (all.movements || []).filter(function (m) { return m.storeId !== state.activeStoreId; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        products: others.concat(state.products),
        movements: othersMov.concat(state.movements)
      }));
      localStorage.setItem(STORES_KEY, JSON.stringify(state.stores));
    } catch (e) { /* ignora — cache é best-effort */ }
  }

  function loadLocalSnapshotIntoState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        var allProducts = parsed.products || [];
        var allMovements = parsed.movements || [];
        state.products = allProducts.filter(function (p) { return p.storeId === state.activeStoreId; });
        state.movements = allMovements.filter(function (m) { return m.storeId === state.activeStoreId; });
        return true;
      }
    } catch (e) { /* ignora */ }
    return false;
  }

  function persistActiveStoreId() {
    try { localStorage.setItem(ACTIVE_STORE_KEY, state.activeStoreId || ""); } catch (e) { /* ignora */ }
  }

  function resolveActiveStoreId(stores) {
    var saved = null;
    try { saved = localStorage.getItem(ACTIVE_STORE_KEY); } catch (e) { /* ignora */ }
    if (saved && stores.some(function (s) { return s.id === saved; })) return saved;
    return stores.length ? stores[0].id : null;
  }

  /* ---- Conversão entre o objeto usado no app (camelCase) e as colunas do Supabase (snake_case) ---- */
  function storeToRow(s) {
    return { name: s.name, icon: s.icon || "🏪", color: s.color || STORE_COLORS[0] };
  }

  function rowToStore(r) {
    return { id: r.id, name: r.name, icon: r.icon || "🏪", color: r.color || STORE_COLORS[0], createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now() };
  }

  function productToRow(p) {
    return {
      store_id: p.storeId,
      barcode: p.barcode || "",
      name: p.name,
      category: p.category || "Outros",
      brand: p.brand || "",
      unit: p.unit || "un",
      stock: Number(p.stock) || 0,
      min_stock: Number(p.minStock) || 0,
      manufacture_date: p.manufactureDate || null,
      expiry_date: p.expiryDate,
      supplier: p.supplier || "",
      notes: p.notes || "",
      image: p.image || ""
    };
  }

  function rowToProduct(r) {
    return {
      id: r.id, storeId: r.store_id, barcode: r.barcode || "", name: r.name, category: r.category || "Outros",
      brand: r.brand || "", unit: r.unit || "un", stock: Number(r.stock) || 0, minStock: Number(r.min_stock) || 0,
      manufactureDate: r.manufacture_date || "", expiryDate: r.expiry_date, supplier: r.supplier || "",
      notes: r.notes || "", image: r.image || "", createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now()
    };
  }

  function movementToRow(m) {
    return {
      store_id: m.storeId, product_id: m.productId, product_name: m.productName, type: m.type,
      quantity: m.quantity, previous_stock: m.previousStock, new_stock: m.newStock, note: m.note || ""
    };
  }

  function rowToMovement(r) {
    return {
      id: r.id, storeId: r.store_id, productId: r.product_id, productName: r.product_name, type: r.type,
      quantity: Number(r.quantity) || 0, previousStock: Number(r.previous_stock) || 0, newStock: Number(r.new_stock) || 0,
      note: r.note || "", timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now()
    };
  }

  /* ---- Autenticação anônima (modo Supabase): cada aparelho recebe uma
     identidade real e estável, usada pelo RLS para isolar os dados. ---- */
  function ensureAuth() {
    return supa.auth.getSession().then(function (res) {
      var session = res.data && res.data.session;
      if (session && session.user) {
        currentUserId = session.user.id;
        return currentUserId;
      }
      return supa.auth.signInAnonymously().then(function (res2) {
        if (res2.error) throw res2.error;
        currentUserId = res2.data.user.id;
        return currentUserId;
      });
    });
  }

  /* ---- Carrega os estabelecimentos do usuário logado; cria um padrão se não houver nenhum ---- */
  function loadStoresFromSupabase() {
    return supa.from("stores").select("*").order("created_at", { ascending: true }).then(function (res) {
      if (res.error) throw res.error;
      state.stores = (res.data || []).map(rowToStore);
      if (state.stores.length === 0) {
        return supa.from("stores").insert(storeToRow({ name: "Meu Estabelecimento", icon: "🏪", color: STORE_COLORS[0] })).select().single()
          .then(function (res2) {
            if (res2.error) throw res2.error;
            state.stores = [rowToStore(res2.data)];
          });
      }
    });
  }

  /* ---- Carrega produtos/movimentos SÓ do estabelecimento ativo ---- */
  function loadStoreScopedDataFromSupabase(storeId) {
    return Promise.all([
      supa.from("products").select("*").eq("store_id", storeId).order("expiry_date", { ascending: true }),
      supa.from("movements").select("*").eq("store_id", storeId).order("created_at", { ascending: false })
    ]).then(function (results) {
      var prodRes = results[0], movRes = results[1];
      if (prodRes.error) throw prodRes.error;
      if (movRes.error) throw movRes.error;
      state.products = (prodRes.data || []).map(rowToProduct);
      state.movements = (movRes.data || []).map(rowToMovement);
      cacheLocalSnapshot();
    });
  }

  /* ---- Realtime: reflete mudanças feitas em outros dispositivos, só do
     estabelecimento ativo — ao trocar de loja, reconecta com novo filtro. ---- */
  function unsubscribeRealtime() {
    if (productsChannel) { supa.removeChannel(productsChannel); productsChannel = null; }
    if (movementsChannel) { supa.removeChannel(movementsChannel); movementsChannel = null; }
  }

  function subscribeRealtimeForStore(storeId) {
    unsubscribeRealtime();
    productsChannel = supa.channel("products-" + storeId)
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: "store_id=eq." + storeId }, function (payload) {
        applyProductRealtimeEvent(payload);
      })
      .subscribe(function (status) {
        if (status === "SUBSCRIBED") setConnStatus("online");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConnStatus("offline");
      });

    movementsChannel = supa.channel("movements-" + storeId)
      .on("postgres_changes", { event: "*", schema: "public", table: "movements", filter: "store_id=eq." + storeId }, function (payload) {
        applyMovementRealtimeEvent(payload);
      })
      .subscribe();
  }

  function subscribeStoresRealtime() {
    supa.channel("stores-" + currentUserId)
      .on("postgres_changes", { event: "*", schema: "public", table: "stores" }, function (payload) {
        applyStoreRealtimeEvent(payload);
      })
      .subscribe();
  }

  function applyStoreRealtimeEvent(payload) {
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
      var incoming = rowToStore(payload.new);
      var idx = -1;
      for (var i = 0; i < state.stores.length; i++) { if (state.stores[i].id === incoming.id) { idx = i; break; } }
      if (idx >= 0) state.stores[idx] = incoming; else state.stores.push(incoming);
    } else if (payload.eventType === "DELETE") {
      var removedId = payload.old && payload.old.id;
      state.stores = state.stores.filter(function (s) { return s.id !== removedId; });
      if (state.activeStoreId === removedId) {
        switchActiveStore(state.stores.length ? state.stores[0].id : null);
        return;
      }
    }
    if (!state.storeModal && !state.confirmDeleteStore) {
      var sel = document.getElementById("store-selector-root");
      if (sel) { sel.outerHTML = renderStoreSelector(); wireStoreSelector(); }
    }
  }

  /** Insere ou substitui um produto no estado local pelo id — nunca duplica. */
  function upsertProductLocal(product) {
    var idx = -1;
    for (var i = 0; i < state.products.length; i++) {
      if (state.products[i].id === product.id) { idx = i; break; }
    }
    if (idx >= 0) state.products[idx] = product;
    else state.products.push(product);
  }

  /** Insere um movimento no início do histórico local — nunca duplica. */
  function upsertMovementLocal(movement) {
    var idx = -1;
    for (var i = 0; i < state.movements.length; i++) {
      if (state.movements[i].id === movement.id) { idx = i; break; }
    }
    if (idx >= 0) state.movements[idx] = movement;
    else state.movements = [movement].concat(state.movements);
  }

  function applyProductRealtimeEvent(payload) {
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
      var incoming = rowToProduct(payload.new);
      if (incoming.storeId !== state.activeStoreId) return; // defesa extra: nunca mistura lojas
      upsertProductLocal(incoming);
    } else if (payload.eventType === "DELETE") {
      var removedId = payload.old && payload.old.id;
      state.products = state.products.filter(function (p) { return p.id !== removedId; });
    }
    cacheLocalSnapshot();
    refreshCurrentTabData();
  }

  function applyMovementRealtimeEvent(payload) {
    if (payload.eventType === "INSERT") {
      var incoming = rowToMovement(payload.new);
      if (incoming.storeId !== state.activeStoreId) return; // defesa extra: nunca mistura lojas
      upsertMovementLocal(incoming);
    } else if (payload.eventType === "DELETE") {
      var removedId = payload.old && payload.old.id;
      state.movements = state.movements.filter(function (m) { return m.id !== removedId; });
    }
    cacheLocalSnapshot();
    refreshCurrentTabData();
  }

  /**
   * Atualiza só os dados na tela, sem reconstruir formulários abertos —
   * evita perder o que o usuário está digitando quando outro aparelho
   * sincroniza uma mudança em segundo plano.
   */
  function refreshCurrentTabData() {
    var modalOpen = !!(state.productModal || state.moveModal || state.confirmDelete);
    if (state.tab === "dashboard" && !modalOpen) {
      var content = document.getElementById("tab-content");
      if (content) { content.innerHTML = renderTabContent(); wireTabContent(); }
    } else if (state.tab === "produtos" && !modalOpen) {
      var list = document.getElementById("produtos-list");
      if (list) { list.innerHTML = renderProdutosList(); wireProdutosListEvents(); }
    } else if (state.tab === "movimentacoes" && !modalOpen) {
      var hist = document.getElementById("mov-history");
      if (hist) hist.innerHTML = renderMovHistory();
    } else if (state.tab === "validade" && !modalOpen) {
      var results = document.getElementById("validade-results");
      if (results) results.innerHTML = renderValidadeResults();
    }
    wireHeader(); // reflete "Carregar dados de exemplo" sumindo/aparecendo
  }

  function setConnStatus(status) {
    connStatus = status;
    var el = document.getElementById("conn-status");
    if (el) el.outerHTML = renderConnStatus();
  }

  function renderConnStatus() {
    if (DB_MODE !== "supabase") return "";
    var meta = {
      connecting: { label: "Conectando…", icon: "sync", color: "var(--muted)" },
      online: { label: "Sincronizado", icon: "cloud", color: "var(--green)" },
      offline: { label: "Sem conexão — mostrando últimos dados salvos", icon: "cloudOff", color: "var(--red)" }
    }[connStatus] || { label: "", icon: "cloud", color: "var(--muted)" };
    return (
      '<span id="conn-status" class="pc-conn-status" style="color:' + meta.color + '" title="' + meta.label + '">' +
      icon(meta.icon) + '<span class="pc-conn-label">' + meta.label + "</span></span>"
    );
  }

  function emptyProduct() {
    return {
      id: null, storeId: state.activeStoreId, barcode: "", name: "", category: CATEGORIAS[0], brand: "", unit: "un",
      stock: 0, minStock: 5, manufactureDate: "", expiryDate: "", supplier: "", notes: "", image: "", createdAt: null
    };
  }

  function buildDemoData() {
    function add(n) {
      var d = new Date();
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    }
    var base = [
      { name: "Leite Integral 1L", category: "Laticínios", brand: "Piracanjuba", unit: "un", stock: 18, minStock: 10, expiryDate: add(-2), barcode: "7891234567890" },
      { name: "Pão de Forma", category: "Padaria", brand: "Wickbold", unit: "un", stock: 6, minStock: 5, expiryDate: add(1), barcode: "7891234567891" },
      { name: "Iogurte Natural 170g", category: "Laticínios", brand: "Nestlé", unit: "un", stock: 24, minStock: 12, expiryDate: add(4), barcode: "7891234567892" },
      { name: "Refrigerante Cola 350ml", category: "Bebidas", brand: "Coca-Cola", unit: "un", stock: 40, minStock: 15, expiryDate: add(120), barcode: "7891234567893" },
      { name: "Batata Chips 90g", category: "Snacks", brand: "Ruffles", unit: "un", stock: 3, minStock: 8, expiryDate: add(18), barcode: "7891234567894" },
      { name: "Café Moído 500g", category: "Mercearia", brand: "Pilão", unit: "pct", stock: 12, minStock: 6, expiryDate: add(200), barcode: "7891234567895" },
      { name: "Sabonete Líquido 250ml", category: "Higiene", brand: "Dove", unit: "un", stock: 9, minStock: 5, expiryDate: add(365), barcode: "7891234567896" },
      { name: "Chocolate ao Leite 90g", category: "Doces", brand: "Lacta", unit: "un", stock: 15, minStock: 10, expiryDate: add(9), barcode: "7891234567897" },
      { name: "Pizza Congelada Muçarela", category: "Congelados", brand: "Sadia", unit: "un", stock: 7, minStock: 4, expiryDate: add(25), barcode: "7891234567898" },
      { name: "Água Mineral 500ml", category: "Bebidas", brand: "Crystal", unit: "un", stock: 60, minStock: 20, expiryDate: add(300), barcode: "7891234567899" },
      { name: "Detergente Neutro 500ml", category: "Limpeza", brand: "Ypê", unit: "un", stock: 14, minStock: 6, expiryDate: add(400), barcode: "7891234567800" },
      { name: "Presunto Fatiado 200g", category: "Laticínios", brand: "Sadia", unit: "pct", stock: 5, minStock: 6, expiryDate: add(0), barcode: "7891234567801" }
    ];
    var now = Date.now();
    var products = base.map(function (p, i) {
      var obj = emptyProduct();
      for (var k in p) obj[k] = p[k];
      obj.id = uid();
      obj.storeId = state.activeStoreId;
      obj.createdAt = now - i * 1000;
      return obj;
    });
    var movements = products.slice(0, 4).map(function (p, i) {
      return {
        id: uid(), storeId: state.activeStoreId, productId: p.id, productName: p.name, type: "entrada",
        quantity: p.stock, previousStock: 0, newStock: p.stock,
        note: "Carga inicial (exemplo)", timestamp: now - (i + 1) * 3600000
      };
    });
    return { products: products, movements: movements };
  }

  /* ================================================================ */
  /* Estabelecimentos: CRUD (local + Supabase) e troca de loja ativa   */
  /* ================================================================ */

  function emptyStore() {
    return { id: null, name: "", icon: STORE_ICONS[0], color: STORE_COLORS[0], createdAt: null };
  }

  function activeStore() {
    for (var i = 0; i < state.stores.length; i++) {
      if (state.stores[i].id === state.activeStoreId) return state.stores[i];
    }
    return state.stores[0] || null;
  }

  /** Troca o estabelecimento ativo e recarrega todos os dados dependentes, sem recarregar a página. */
  function switchActiveStore(storeId) {
    if (!storeId || storeId === state.activeStoreId) {
      state.storeMenuOpen = false;
      render();
      return;
    }
    state.activeStoreId = storeId;
    persistActiveStoreId();
    state.storeMenuOpen = false;
    state.productModal = null;
    state.moveModal = null;
    state.confirmDelete = null;

    if (DB_MODE === "supabase") {
      connStatus = "connecting";
      render();
      loadStoreScopedDataFromSupabase(storeId)
        .then(function () {
          connStatus = "online";
          render();
          subscribeRealtimeForStore(storeId);
        })
        .catch(function (err) {
          console.error("Falha ao trocar de estabelecimento", err);
          var hadCache = loadLocalSnapshotIntoState();
          connStatus = "offline";
          render();
          showToast(hadCache ? "Sem conexão — mostrando os últimos dados salvos deste estabelecimento." : "Não foi possível carregar este estabelecimento agora.");
        });
    } else {
      refilterLocalToActiveStore();
      render();
    }
  }

  function saveStore(store) {
    var isEdit = !!store.id;

    if (DB_MODE === "supabase") {
      var query = isEdit
        ? supa.from("stores").update(storeToRow(store)).eq("id", store.id).select().single()
        : supa.from("stores").insert(storeToRow(store)).select().single();

      return query.then(function (res) {
        if (res.error) throw res.error;
        var saved = rowToStore(res.data);
        var idx = -1;
        for (var i = 0; i < state.stores.length; i++) { if (state.stores[i].id === saved.id) { idx = i; break; } }
        if (idx >= 0) state.stores[idx] = saved; else state.stores.push(saved);
        state.storeModal = null;
        showToast(isEdit ? "Estabelecimento atualizado." : "Estabelecimento criado.");
        if (!isEdit) {
          switchActiveStore(saved.id);
        } else {
          render();
        }
      });
    }

    if (isEdit) {
      state.stores = state.stores.map(function (s) { return s.id === store.id ? store : s; });
    } else {
      store.id = uid();
      store.createdAt = Date.now();
      state.stores.push(store);
    }
    saveLocalStores();
    state.storeModal = null;
    showToast(isEdit ? "Estabelecimento atualizado." : "Estabelecimento criado.");
    if (!isEdit) {
      switchActiveStore(store.id);
    } else {
      render();
    }
  }

  function deleteStore(store) {
    if (state.stores.length <= 1) {
      showToast("Você precisa manter ao menos um estabelecimento.");
      state.confirmDeleteStore = null;
      render();
      return;
    }

    if (DB_MODE === "supabase") {
      supa.from("stores").delete().eq("id", store.id).then(function (res) {
        if (res.error) throw res.error;
        finishStoreDeletion(store.id);
      }).catch(function (err) {
        console.error("Falha ao excluir estabelecimento", err);
        showToast("Não foi possível excluir no banco de dados. Tente novamente.");
      });
    } else {
      localProductsAll = localProductsAll.filter(function (p) { return p.storeId !== store.id; });
      localMovementsAll = localMovementsAll.filter(function (m) { return m.storeId !== store.id; });
      saveLocalAll();
      finishStoreDeletion(store.id);
    }
  }

  function finishStoreDeletion(storeId) {
    state.stores = state.stores.filter(function (s) { return s.id !== storeId; });
    if (DB_MODE !== "supabase") saveLocalStores();
    state.confirmDeleteStore = null;
    showToast("Estabelecimento excluído.");
    if (state.activeStoreId === storeId) {
      switchActiveStore(state.stores.length ? state.stores[0].id : null);
    } else {
      render();
    }
  }



  /* ================================================================ */
  /* Toast                                                             */
  /* ================================================================ */

  var toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById("pc-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "pc-toast";
      el.className = "pc-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.style.display = "none"; }, 3200);
  }

  /* ================================================================ */
  /* Render raiz                                                       */
  /* ================================================================ */

  var TABS = [
    { key: "dashboard", label: "Painel", icon: "dashboard" },
    { key: "produtos", label: "Produtos", icon: "package" },
    { key: "movimentacoes", label: "Movimentos", icon: "swap" },
    { key: "validade", label: "Validade", icon: "calendar" }
  ];

  function render() {
    var view = document.getElementById("view");
    var html = "";

    html += renderHeader();
    html += renderInstallBanner();
    html += renderNav();
    html += '<div id="tab-content">' + renderTabContent() + "</div>";

    view.innerHTML = html;

    wireHeader();
    wireStoreSelector();
    wireNav();
    wireTabContent();

    renderModals();
  }

  function renderHeader() {
    return (
      '<header class="pc-header">' +
      '<div class="pc-brand">' +
      '<div class="pc-brand-mark"><img src="/icons/icon-96.png" alt="" width="42" height="42"/></div>' +
      "<div><div class=\"pc-title\">Prazo Certo</div>" +
      renderStoreSelector() +
      "</div>" +
      "</div>" +
      '<div style="display:flex;align-items:center;gap:10px">' +
      renderConnStatus() +
      (state.products.length === 0 && state.activeStoreId
        ? '<button class="pc-btn pc-btn-secondary" data-action="load-demo">Carregar dados de exemplo</button>'
        : "") +
      "</div>" +
      "</header>"
    );
  }

  function wireHeader() {
    var btn = document.querySelector('[data-action="load-demo"]');
    if (btn) btn.addEventListener("click", function () {
      btn.disabled = true;
      loadDemoData();
    });
  }

  /* ---- Seletor de estabelecimento (dropdown no cabeçalho) ---- */
  function renderStoreSelector() {
    var current = activeStore();
    if (!current) {
      return (
        '<div id="store-selector-root">' +
        '<button class="pc-store-trigger pc-store-trigger-empty" data-action="new-store-quick">' +
        icon("plus") + " Criar estabelecimento</button></div>"
      );
    }

    var itemsHtml = state.stores.map(function (s) {
      var active = s.id === state.activeStoreId;
      return (
        '<button class="pc-store-item' + (active ? " active" : "") + '" data-switch-store="' + s.id + '">' +
        '<span class="pc-store-dot" style="background:' + s.color + '">' + s.icon + "</span>" +
        '<span class="pc-store-item-name">' + escapeHtml(s.name) + "</span>" +
        (active ? icon("check", "pc-store-check") : "") +
        "</button>"
      );
    }).join("");

    return (
      '<div id="store-selector-root" class="pc-store-selector">' +
      '<button class="pc-store-trigger" data-action="toggle-store-menu" aria-expanded="' + (state.storeMenuOpen ? "true" : "false") + '">' +
      '<span class="pc-store-dot" style="background:' + current.color + '">' + current.icon + "</span>" +
      '<span class="pc-store-trigger-name">' + escapeHtml(current.name) + "</span>" +
      icon("chevronDown", "pc-store-chevron" + (state.storeMenuOpen ? " open" : "")) +
      "</button>" +
      '<div class="pc-store-menu' + (state.storeMenuOpen ? " open" : "") + '">' +
      '<div class="pc-store-menu-list">' + itemsHtml + "</div>" +
      '<div class="pc-store-menu-actions">' +
      '<button class="pc-store-menu-action" data-action="new-store-quick">' + icon("plus") + " Novo estabelecimento</button>" +
      '<button class="pc-store-menu-action" data-action="manage-stores">' + icon("settings") + " Meus estabelecimentos</button>" +
      "</div></div></div>"
    );
  }

  function wireStoreSelector() {
    var trigger = document.querySelector('[data-action="toggle-store-menu"]');
    if (trigger) trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      state.storeMenuOpen = !state.storeMenuOpen;
      var root = document.getElementById("store-selector-root");
      if (root) { root.outerHTML = renderStoreSelector(); wireStoreSelector(); }
    });

    forEachEl("[data-switch-store]", function (el) {
      el.addEventListener("click", function (e) {
        switchActiveStore(e.currentTarget.getAttribute("data-switch-store"));
      });
    });

    forEachEl('[data-action="new-store-quick"]', function (el) {
      el.addEventListener("click", function () {
        state.storeMenuOpen = false;
        state.storeModal = emptyStore();
        render();
      });
    });

    forEachEl('[data-action="manage-stores"]', function (el) {
      el.addEventListener("click", function () {
        state.storeMenuOpen = false;
        state.showStoresScreen = true;
        render();
      });
    });

    if (state.storeMenuOpen && !wireStoreSelector._docBound) {
      wireStoreSelector._docBound = true;
    }
  }

  document.addEventListener("click", function (e) {
    if (!state.storeMenuOpen) return;
    var root = document.getElementById("store-selector-root");
    if (root && !root.contains(e.target)) {
      state.storeMenuOpen = false;
      var fresh = document.getElementById("store-selector-root");
      if (fresh) { fresh.outerHTML = renderStoreSelector(); wireStoreSelector(); }
    }
  });

  function loadDemoData() {
    var demo = buildDemoData();

    if (DB_MODE !== "supabase") {
      localProductsAll = localProductsAll.concat(demo.products);
      localMovementsAll = demo.movements.concat(localMovementsAll);
      saveLocalAll();
      refilterLocalToActiveStore();
      render();
      return;
    }

    var tempIdToIndex = {};
    demo.products.forEach(function (p, idx) { tempIdToIndex[p.id] = idx; });

    supa.from("products").insert(demo.products.map(productToRow)).select()
      .then(function (res) {
        if (res.error) throw res.error;
        var insertedProducts = res.data.map(rowToProduct);
        insertedProducts.forEach(upsertProductLocal);

        var movRows = demo.movements.map(function (m) {
          var idx = tempIdToIndex[m.productId];
          var real = insertedProducts[idx];
          return real ? {
            store_id: state.activeStoreId, product_id: real.id, product_name: m.productName, type: m.type,
            quantity: m.quantity, previous_stock: m.previousStock, new_stock: m.newStock, note: m.note
          } : null;
        }).filter(Boolean);

        return movRows.length ? supa.from("movements").insert(movRows).select() : Promise.resolve({ data: [] });
      })
      .then(function (res) {
        if (res.error) throw res.error;
        (res.data || []).map(rowToMovement).forEach(upsertMovementLocal);
        cacheLocalSnapshot();
        showToast("Dados de exemplo carregados e sincronizados para todos os dispositivos.");
        render();
      })
      .catch(function (err) {
        console.error("Falha ao carregar dados de exemplo no Supabase", err);
        showToast("Não foi possível carregar os dados de exemplo no banco. Confira a configuração do Supabase.");
        render();
      });
  }

  function renderInstallBanner() {
    if (state.installBannerDismissed) return "";
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return "";
    if (window.navigator.standalone === true) return "";
    var isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (state.deferredInstallPrompt) {
      return (
        '<div class="pc-install-banner">' +
        icon("download") +
        '<div class="txt">Instale o Prazo Certo na tela inicial para acesso rápido, como um aplicativo.</div>' +
        '<button class="pc-btn pc-btn-secondary" data-action="install-app" style="background:#fff">Instalar</button>' +
        '<button class="pc-install-close" data-action="dismiss-install" aria-label="Fechar">' + icon("close") + "</button>" +
        "</div>"
      );
    }
    if (isIos) {
      return (
        '<div class="pc-install-banner">' +
        icon("download") +
        '<div class="txt">No iPhone: toque em compartilhar e depois em "Adicionar à Tela de Início" para instalar o app.</div>' +
        '<button class="pc-install-close" data-action="dismiss-install" aria-label="Fechar">' + icon("close") + "</button>" +
        "</div>"
      );
    }
    return "";
  }

  function wireInstallBanner() {
    var installBtn = document.querySelector('[data-action="install-app"]');
    if (installBtn) installBtn.addEventListener("click", function () {
      if (!state.deferredInstallPrompt) return;
      state.deferredInstallPrompt.prompt();
      state.deferredInstallPrompt.userChoice.finally(function () {
        state.deferredInstallPrompt = null;
        render();
      });
    });
    var closeBtn = document.querySelector('[data-action="dismiss-install"]');
    if (closeBtn) closeBtn.addEventListener("click", function () {
      state.installBannerDismissed = true;
      render();
    });
  }

  function renderNav() {
    return (
      '<nav class="pc-nav">' +
      TABS.map(function (t) {
        return (
          '<button class="pc-nav-btn ' + (state.tab === t.key ? "active" : "") + '" data-tab="' + t.key + '">' +
          icon(t.icon) + "<span>" + t.label + "</span></button>"
        );
      }).join("") +
      "</nav>"
    );
  }

  function wireNav() {
    var btns = document.querySelectorAll(".pc-nav-btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function (e) {
        var key = e.currentTarget.getAttribute("data-tab");
        state.tab = key;
        render();
      });
    }
    wireInstallBanner();
  }

  function renderTabContent() {
    if (state.tab === "dashboard") return renderDashboard();
    if (state.tab === "produtos") return renderProdutos();
    if (state.tab === "movimentacoes") return renderMovimentacoes();
    if (state.tab === "validade") return renderValidade();
    return "";
  }

  function wireTabContent() {
    if (state.tab === "dashboard") wireDashboard();
    if (state.tab === "produtos") wireProdutos();
    if (state.tab === "movimentacoes") wireMovimentacoes();
    if (state.tab === "validade") wireValidade();
  }

  function goValidade(status) {
    state.validadeFilter.status = status;
    state.tab = "validade";
    render();
  }

  /* ================================================================ */
  /* Dashboard                                                         */
  /* ================================================================ */

  function computeStats() {
    var withDays = state.products.map(function (p) {
      var d = daysUntil(p.expiryDate);
      var copy = {};
      for (var k in p) copy[k] = p[k];
      copy.days = d;
      return copy;
    });
    var vencidos = withDays.filter(function (p) { return p.days !== null && p.days < 0; }).length;
    var ate7 = withDays.filter(function (p) { return p.days !== null && p.days >= 0 && p.days <= 7; }).length;
    var de8a30 = withDays.filter(function (p) { return p.days !== null && p.days >= 8 && p.days <= 30; }).length;
    var baixoEstoque = state.products.filter(function (p) { return p.minStock > 0 && p.stock <= p.minStock; }).length;
    var totalEstoque = state.products.reduce(function (s, p) { return s + (Number(p.stock) || 0); }, 0);
    var hoje = withDays.filter(function (p) { return p.days === 0; }).length;
    var ate15 = withDays.filter(function (p) { return p.days !== null && p.days >= 0 && p.days <= 15; }).length;
    var ok = withDays.filter(function (p) { return p.days !== null && p.days > 30; }).length;
    return { vencidos: vencidos, ate7: ate7, de8a30: de8a30, baixoEstoque: baixoEstoque, totalEstoque: totalEstoque, hoje: hoje, ate15: ate15, ok: ok, total: state.products.length, withDays: withDays };
  }

  function renderDashboard() {
    var s = computeStats();
    var cards = [
      { label: "Produtos cadastrados", value: s.total, color: "var(--brand)" },
      { label: "Unidades em estoque", value: s.totalEstoque, color: "var(--brand)" },
      { label: "Produtos vencidos", value: s.vencidos, color: "var(--red)" },
      { label: "Vencem em até 7 dias", value: s.ate7, color: "var(--amber-strong)" },
      { label: "Vencem entre 8 e 30 dias", value: s.de8a30, color: "var(--amber)" },
      { label: "Estoque baixo", value: s.baixoEstoque, color: "var(--brand-dark)" }
    ];

    var statCardsHtml = cards.map(function (c) {
      return (
        '<div class="pc-stat"><div class="pc-stat-bar" style="background:' + c.color + '"></div>' +
        '<div class="pc-stat-label">' + c.label + "</div>" +
        '<div class="pc-stat-value" style="color:' + c.color + '">' + c.value + "</div></div>"
      );
    }).join("");

    var rulerSegs = [
      { key: "vencido", count: s.vencidos, color: "var(--red)", label: "Vencidos" },
      { key: "critico", count: s.ate7, color: "var(--amber-strong)", label: "≤ 7 dias" },
      { key: "atencao", count: s.de8a30, color: "var(--amber)", label: "8–30 dias" },
      { key: "ok", count: s.ok, color: "var(--green)", label: "Dentro da validade" }
    ];

    var rulerHtml;
    if (s.total === 0) {
      rulerHtml = '<p class="pc-muted" style="font-size:13px">Cadastre produtos para visualizar a régua de validade.</p>';
    } else {
      rulerHtml =
        '<div class="pc-ruler">' +
        rulerSegs.filter(function (seg) { return seg.count > 0; }).map(function (seg) {
          return '<div style="background:' + seg.color + ";flex-grow:" + seg.count + ';flex-basis:0" title="' + seg.label + ": " + seg.count + '">' + seg.count + "</div>";
        }).join("") +
        "</div>" +
        '<div class="pc-ruler-legend">' +
        rulerSegs.map(function (seg) {
          return '<div class="item"><span class="dot" style="background:' + seg.color + '"></span>' + seg.label + " (" + seg.count + ")</div>";
        }).join("") +
        "</div>";
    }

    var alerts = [
      { label: "Vencidos", count: s.vencidos, color: "var(--red)", status: "vencido" },
      { label: "Vence hoje", count: s.hoje, color: "var(--red)", status: "hoje" },
      { label: "≤ 7 dias", count: s.ate7, color: "var(--amber-strong)", status: "7" },
      { label: "≤ 15 dias", count: s.ate15, color: "var(--amber)", status: "15" },
      { label: "≤ 30 dias", count: s.de8a30 + s.ate7, color: "var(--amber)", status: "30" },
      { label: "Estoque baixo", count: s.baixoEstoque, color: "var(--brand)", status: "estoque" }
    ];

    var alertsHtml = alerts.map(function (a) {
      return (
        '<button class="pc-chip" data-goto-validade="' + a.status + '">' +
        '<span class="bullet" style="background:' + a.color + '"></span>' +
        '<span><div class="pc-chip-count" style="color:' + a.color + '">' + a.count + "</div>" +
        '<div class="pc-chip-label">' + a.label + "</div></span></button>"
      );
    }).join("");

    var chartData = s.withDays.filter(function (p) { return p.days !== null; })
      .sort(function (a, b) { return a.days - b.days; })
      .slice(0, 10);

    var chartHtml;
    if (chartData.length === 0) {
      chartHtml = '<div class="pc-empty" style="padding:28px 0">' + icon("calendar") + "<p>Nenhum produto com data de vencimento cadastrada ainda.</p></div>";
    } else {
      var maxDays = Math.max.apply(null, chartData.map(function (p) { return Math.max(p.days, 1); }));
      chartHtml = '<div class="pc-barlist">' + chartData.map(function (p) {
        var status = statusFromDays(p.days);
        var color = STATUS_META[status].color;
        var pct = Math.max(4, Math.round((Math.max(p.days, 0) / maxDays) * 100));
        return (
          '<div class="pc-barlist-row">' +
          '<div class="pc-barlist-name" title="' + escapeHtml(p.name) + '">' + escapeHtml(p.name) + "</div>" +
          '<div class="pc-barlist-track"><div class="pc-barlist-fill" style="width:' + pct + "%;background:" + color + '"></div></div>' +
          '<div class="pc-barlist-val">' + p.days + "d</div>" +
          "</div>"
        );
      }).join("") + "</div>";
    }

    return (
      '<div class="pc-stat-grid">' + statCardsHtml + "</div>" +
      '<div class="pc-card"><div class="pc-flex-between"><h3 class="pc-card-title">Régua de validade</h3>' +
      '<span class="pc-muted" style="font-size:12px">' + s.total + " produtos no total</span></div>" +
      '<div style="margin-top:12px">' + rulerHtml + "</div></div>" +
      '<div class="pc-card"><h3 class="pc-card-title">Alertas de validade</h3>' +
      '<p class="pc-card-sub">Toque em um alerta para ver a lista filtrada</p>' +
      '<div class="pc-chip-grid">' + alertsHtml + "</div></div>" +
      '<div class="pc-card"><h3 class="pc-card-title">Produtos mais próximos do vencimento</h3>' +
      '<p class="pc-card-sub">Dias restantes até o vencimento (10 primeiros)</p>' + chartHtml + "</div>"
    );
  }

  function wireDashboard() {
    var chips = document.querySelectorAll("[data-goto-validade]");
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener("click", function (e) {
        goValidade(e.currentTarget.getAttribute("data-goto-validade"));
      });
    }
  }

  /* ================================================================ */
  /* Produtos                                                          */
  /* ================================================================ */

  function filteredProdutos() {
    var f = state.produtosFilter;
    return state.products.filter(function (p) {
      if (f.categoria !== "todas" && p.category !== f.categoria) return false;
      if (f.q) {
        var s = f.q.toLowerCase();
        if (p.name.toLowerCase().indexOf(s) === -1 && p.barcode.indexOf(s) === -1 && (p.brand || "").toLowerCase().indexOf(s) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  function renderProdutos() {
    return (
      '<div class="pc-toolbar">' +
      '<div class="pc-search">' + icon("search") + '<input class="pc-input" id="produtos-search" placeholder="Buscar por nome, marca ou código de barras" value="' + escapeHtml(state.produtosFilter.q) + '"/></div>' +
      '<select class="pc-select" id="produtos-cat" style="width:170px">' +
      '<option value="todas">Todas categorias</option>' +
      CATEGORIAS.map(function (c) { return '<option value="' + c + '"' + (state.produtosFilter.categoria === c ? " selected" : "") + ">" + c + "</option>"; }).join("") +
      "</select>" +
      '<button class="pc-btn pc-btn-secondary" data-action="scan-new-product">' + icon("camera") + " Escanear código</button>" +
      '<button class="pc-btn pc-btn-primary" data-action="new-product">' + icon("plus") + " Novo produto</button>" +
      "</div>" +
      '<div id="produtos-list"></div>'
    );
  }

  function renderProdutosList() {
    var filtered = filteredProdutos();
    if (filtered.length === 0) {
      return (
        '<div class="pc-card pc-empty">' + icon("inbox") +
        "<p>" + (state.products.length === 0 ? "Nenhum produto cadastrado ainda." : "Nenhum produto corresponde à busca.") + "</p>" +
        (state.products.length === 0 ? '<button class="pc-btn pc-btn-primary" data-action="new-product">' + icon("plus") + " Cadastrar primeiro produto</button>" : "") +
        "</div>"
      );
    }
    var rows = filtered.map(function (p) {
      var days = daysUntil(p.expiryDate);
      var low = p.minStock > 0 && p.stock <= p.minStock;
      return (
        "<tr>" +
        '<td><div style="display:flex;align-items:center;gap:10px">' +
        (p.image
          ? '<img src="' + escapeHtml(p.image) + '" alt="" class="pc-thumb" onerror="this.style.display=\'none\'"/>'
          : '<div class="pc-thumb pc-thumb-placeholder">' + icon("package") + "</div>") +
        '<div><div style="font-weight:700">' + escapeHtml(p.name) + '</div><div class="pc-mono pc-muted" style="font-size:11.5px">' + (p.barcode ? escapeHtml(p.barcode) : "sem código") + "</div></div>" +
        "</div></td>" +
        "<td>" + escapeHtml(p.category) + "</td>" +
        "<td>" + (p.brand ? escapeHtml(p.brand) : "—") + "</td>" +
        '<td><span style="font-weight:700;color:' + (low ? "var(--red)" : "var(--ink)") + '">' + p.stock + " " + escapeHtml(p.unit) + "</span>" +
        (low ? '<div style="font-size:11px;color:var(--red)">abaixo do mínimo (' + p.minStock + ")</div>" : "") + "</td>" +
        "<td>" + formatDate(p.expiryDate) + "</td>" +
        "<td>" + badge(days, true) + "</td>" +
        '<td><div class="pc-cell-actions">' +
        '<button class="pc-icon-btn" title="Movimentar estoque" data-move="' + p.id + '">' + icon("swap") + "</button>" +
        '<button class="pc-icon-btn" title="Editar" data-edit="' + p.id + '">' + icon("edit") + "</button>" +
        '<button class="pc-icon-btn" title="Excluir" data-delete="' + p.id + '">' + icon("trash") + "</button>" +
        "</div></td></tr>"
      );
    }).join("");

    return (
      '<div class="pc-table-wrap"><table class="pc-table"><thead><tr>' +
      "<th>Produto</th><th>Categoria</th><th>Marca</th><th>Estoque</th><th>Validade</th><th>Status</th><th style=\"text-align:right\">Ações</th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table></div>"
    );
  }

  function wireProdutos() {
    document.getElementById("produtos-list").innerHTML = renderProdutosList();

    var search = document.getElementById("produtos-search");
    search.addEventListener("input", function (e) {
      state.produtosFilter.q = e.target.value;
      document.getElementById("produtos-list").innerHTML = renderProdutosList();
      wireProdutosListEvents();
    });

    document.getElementById("produtos-cat").addEventListener("change", function (e) {
      state.produtosFilter.categoria = e.target.value;
      document.getElementById("produtos-list").innerHTML = renderProdutosList();
      wireProdutosListEvents();
    });

    var newBtns = document.querySelectorAll('[data-action="new-product"]');
    for (var i = 0; i < newBtns.length; i++) {
      newBtns[i].addEventListener("click", function () {
        state.productModal = emptyProduct();
        render();
      });
    }

    var scanBtns = document.querySelectorAll('[data-action="scan-new-product"]');
    for (var j = 0; j < scanBtns.length; j++) {
      scanBtns[j].addEventListener("click", function () {
        openScanner(function (code) {
          var p = emptyProduct();
          p.barcode = code;
          state.pendingAutoLookup = code;
          state.productModal = p;
          render();
        });
      });
    }

    wireProdutosListEvents();
  }

  function wireProdutosListEvents() {
    forEachEl("[data-move]", function (el) {
      el.addEventListener("click", function (e) {
        state.moveModal = findProduct(e.currentTarget.getAttribute("data-move"));
        render();
      });
    });
    forEachEl("[data-edit]", function (el) {
      el.addEventListener("click", function (e) {
        state.productModal = findProduct(e.currentTarget.getAttribute("data-edit"));
        render();
      });
    });
    forEachEl("[data-delete]", function (el) {
      el.addEventListener("click", function (e) {
        state.confirmDelete = findProduct(e.currentTarget.getAttribute("data-delete"));
        render();
      });
    });
    forEachEl('[data-action="new-product"]', function (el) {
      el.addEventListener("click", function () {
        state.productModal = emptyProduct();
        render();
      });
    });
  }

  function forEachEl(sel, fn) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) fn(els[i]);
  }

  function findProduct(id) {
    for (var i = 0; i < state.products.length; i++) {
      if (state.products[i].id === id) return state.products[i];
    }
    return null;
  }

  /* ================================================================ */
  /* Movimentações                                                     */
  /* ================================================================ */

  var MOV_TYPE_META = {
    entrada: { label: "Entrada", color: "var(--green)", bg: "var(--green-bg)", icon: "down" },
    saida: { label: "Saída", color: "var(--red)", bg: "var(--red-bg)", icon: "up" },
    ajuste: { label: "Ajuste", color: "var(--amber-strong)", bg: "var(--amber-bg)", icon: "wrench" }
  };

  function renderMovimentacoes() {
    return (
      '<div class="pc-card">' +
      '<h3 class="pc-card-title">Registrar movimentação</h3>' +
      '<div class="pc-search" style="margin-top:10px">' + icon("search") +
      '<input class="pc-input" id="mov-search" placeholder="Digite o nome ou código do produto para movimentar" value="' + escapeHtml(state.movFilter.q) + '"/></div>' +
      '<div id="mov-suggestions" style="margin-top:10px;display:flex;flex-direction:column;gap:6px"></div>' +
      "</div>" +
      '<div class="pc-card">' +
      '<div class="pc-flex-between"><h3 class="pc-card-title">Histórico de movimentações</h3>' +
      '<select class="pc-select" id="mov-type" style="width:160px">' +
      '<option value="todos"' + (state.movFilter.type === "todos" ? " selected" : "") + ">Todos os tipos</option>" +
      '<option value="entrada"' + (state.movFilter.type === "entrada" ? " selected" : "") + ">Entradas</option>" +
      '<option value="saida"' + (state.movFilter.type === "saida" ? " selected" : "") + ">Saídas</option>" +
      '<option value="ajuste"' + (state.movFilter.type === "ajuste" ? " selected" : "") + ">Ajustes</option>" +
      "</select></div>" +
      '<div id="mov-history" style="margin-top:12px"></div>' +
      "</div>"
    );
  }

  function renderMovSuggestions() {
    var q = state.movFilter.q;
    if (!q) return "";
    var s = q.toLowerCase();
    var matches = state.products.filter(function (p) { return p.name.toLowerCase().indexOf(s) !== -1 || p.barcode.indexOf(s) !== -1; }).slice(0, 6);
    return matches.map(function (p) {
      return (
        '<button class="pc-chip" style="justify-content:space-between;width:100%" data-move-suggest="' + p.id + '">' +
        '<span><div style="font-weight:700;font-size:13.5px">' + escapeHtml(p.name) + '</div><div class="pc-muted" style="font-size:11.5px">Estoque: ' + p.stock + " " + escapeHtml(p.unit) + "</div></span>" +
        icon("swap") + "</button>"
      );
    }).join("");
  }

  function renderMovHistory() {
    var f = state.movFilter;
    var list = state.movements.filter(function (m) { return f.type === "todos" || m.type === f.type; })
      .sort(function (a, b) { return b.timestamp - a.timestamp; });

    if (list.length === 0) {
      return '<div class="pc-empty" style="padding:28px 0">' + icon("swap") + "<p>Nenhuma movimentação registrada ainda.</p></div>";
    }

    var rows = list.map(function (m) {
      var meta = MOV_TYPE_META[m.type];
      return (
        "<tr>" +
        '<td style="white-space:nowrap;font-size:12.5px">' + formatDateTime(m.timestamp) + "</td>" +
        '<td style="font-weight:600">' + escapeHtml(m.productName) + "</td>" +
        '<td><span class="pc-badge" style="color:' + meta.color + ";background:" + meta.bg + '">' + icon(meta.icon) + " " + meta.label + "</span></td>" +
        "<td>" + (m.type === "ajuste" ? "→ " + m.newStock : m.quantity) + "</td>" +
        '<td style="font-weight:700">' + m.newStock + "</td>" +
        '<td class="pc-muted">' + (m.note ? escapeHtml(m.note) : "—") + "</td>" +
        "</tr>"
      );
    }).join("");

    return (
      '<div class="pc-table-wrap"><table class="pc-table"><thead><tr>' +
      "<th>Data e hora</th><th>Produto</th><th>Tipo</th><th>Quantidade</th><th>Estoque resultante</th><th>Observação</th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table></div>"
    );
  }

  function wireMovimentacoes() {
    document.getElementById("mov-suggestions").innerHTML = renderMovSuggestions();
    document.getElementById("mov-history").innerHTML = renderMovHistory();

    document.getElementById("mov-search").addEventListener("input", function (e) {
      state.movFilter.q = e.target.value;
      document.getElementById("mov-suggestions").innerHTML = renderMovSuggestions();
      wireMovSuggestClicks();
    });

    document.getElementById("mov-type").addEventListener("change", function (e) {
      state.movFilter.type = e.target.value;
      document.getElementById("mov-history").innerHTML = renderMovHistory();
    });

    wireMovSuggestClicks();
  }

  function wireMovSuggestClicks() {
    forEachEl("[data-move-suggest]", function (el) {
      el.addEventListener("click", function (e) {
        state.moveModal = findProduct(e.currentTarget.getAttribute("data-move-suggest"));
        state.movFilter.q = "";
        render();
      });
    });
  }

  /* ================================================================ */
  /* Validade                                                          */
  /* ================================================================ */

  function getMarcas() {
    var set = {};
    state.products.forEach(function (p) { if (p.brand) set[p.brand] = true; });
    return Object.keys(set).sort();
  }

  function renderValidade() {
    var marcas = getMarcas();
    var f = state.validadeFilter;
    return (
      '<div class="pc-card">' +
      '<div class="pc-flex-between" style="margin-bottom:12px">' +
      '<div style="display:flex;align-items:center;gap:8px">' + icon("filter") + '<h3 class="pc-card-title" style="font-size:18px">Filtros</h3></div>' +
      '<button class="pc-btn pc-btn-ghost" id="validade-reset">' + icon("rotate") + " Limpar</button>" +
      "</div>" +
      '<div class="pc-filter-grid">' +
      '<input class="pc-input" id="v-nome" placeholder="Nome do produto" value="' + escapeHtml(f.nome) + '"/>' +
      '<input class="pc-input pc-mono" id="v-barcode" placeholder="Código de barras" value="' + escapeHtml(f.barcode) + '"/>' +
      '<select class="pc-select" id="v-categoria">' +
      '<option value="todas">Todas categorias</option>' +
      CATEGORIAS.map(function (c) { return '<option value="' + c + '"' + (f.categoria === c ? " selected" : "") + ">" + c + "</option>"; }).join("") +
      "</select>" +
      '<select class="pc-select" id="v-marca">' +
      '<option value="todas">Todas marcas</option>' +
      marcas.map(function (m) { return '<option value="' + escapeHtml(m) + '"' + (f.marca === m ? " selected" : "") + ">" + escapeHtml(m) + "</option>"; }).join("") +
      "</select>" +
      '<select class="pc-select" id="v-status">' +
      option("todos", "Todos os status", f.status) +
      option("vencido", "Vencidos", f.status) +
      option("hoje", "Vence hoje", f.status) +
      option("7", "Vence em até 7 dias", f.status) +
      option("15", "Vence em até 15 dias", f.status) +
      option("30", "Vence em até 30 dias", f.status) +
      option("ok", "Dentro da validade (+30 dias)", f.status) +
      option("estoque", "Estoque baixo", f.status) +
      "</select>" +
      "</div></div>" +
      '<div id="validade-results"></div>'
    );
  }

  function option(value, label, current) {
    return '<option value="' + value + '"' + (current === value ? " selected" : "") + ">" + label + "</option>";
  }

  function filteredValidade() {
    var f = state.validadeFilter;
    return state.products.map(function (p) {
      var copy = {};
      for (var k in p) copy[k] = p[k];
      copy.days = daysUntil(p.expiryDate);
      return copy;
    }).filter(function (p) {
      if (f.nome && p.name.toLowerCase().indexOf(f.nome.toLowerCase()) === -1) return false;
      if (f.barcode && p.barcode.indexOf(f.barcode) === -1) return false;
      if (f.categoria !== "todas" && p.category !== f.categoria) return false;
      if (f.marca !== "todas" && p.brand !== f.marca) return false;
      if (f.status !== "todos") {
        if (f.status === "hoje" && p.days !== 0) return false;
        if (f.status === "7" && !(p.days !== null && p.days >= 0 && p.days <= 7)) return false;
        if (f.status === "15" && !(p.days !== null && p.days >= 0 && p.days <= 15)) return false;
        if (f.status === "30" && !(p.days !== null && p.days >= 0 && p.days <= 30)) return false;
        if (f.status === "vencido" && !(p.days !== null && p.days < 0)) return false;
        if (f.status === "ok" && !(p.days !== null && p.days > 30)) return false;
        if (f.status === "estoque" && !(p.minStock > 0 && p.stock <= p.minStock)) return false;
      }
      return true;
    }).sort(function (a, b) {
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return a.days - b.days;
    });
  }

  function renderValidadeResults() {
    var rows = filteredValidade();
    var table;
    if (rows.length === 0) {
      table = '<div class="pc-card pc-empty">' + icon("calendar") + "<p>Nenhum produto encontrado para os filtros selecionados.</p></div>";
    } else {
      var trs = rows.map(function (p) {
        return (
          "<tr><td style=\"font-weight:700\">" + escapeHtml(p.name) + "</td>" +
          "<td>" + escapeHtml(p.category) + "</td>" +
          "<td>" + (p.brand ? escapeHtml(p.brand) : "—") + "</td>" +
          '<td class="pc-mono" style="font-size:12px">' + (p.barcode ? escapeHtml(p.barcode) : "—") + "</td>" +
          "<td>" + p.stock + " " + escapeHtml(p.unit) + "</td>" +
          "<td>" + formatDate(p.expiryDate) + "</td>" +
          "<td>" + badge(p.days, true) + "</td></tr>"
        );
      }).join("");
      table =
        '<div class="pc-table-wrap"><table class="pc-table"><thead><tr>' +
        "<th>Produto</th><th>Categoria</th><th>Marca</th><th>Código de barras</th><th>Estoque</th><th>Vencimento</th><th>Status</th>" +
        "</tr></thead><tbody>" + trs + "</tbody></table></div>";
    }
    return table + '<p class="pc-muted" style="font-size:12px;margin-top:10px">' + rows.length + " de " + state.products.length + " produtos exibidos, ordenados por data de vencimento.</p>";
  }

  function wireValidade() {
    document.getElementById("validade-results").innerHTML = renderValidadeResults();

    var ids = ["v-nome", "v-barcode", "v-categoria", "v-marca", "v-status"];
    var keys = { "v-nome": "nome", "v-barcode": "barcode", "v-categoria": "categoria", "v-marca": "marca", "v-status": "status" };
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      var evt = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, function (e) {
        state.validadeFilter[keys[id]] = e.target.value;
        document.getElementById("validade-results").innerHTML = renderValidadeResults();
      });
    });

    document.getElementById("validade-reset").addEventListener("click", function () {
      state.validadeFilter = { nome: "", barcode: "", categoria: "todas", marca: "todas", status: "todos" };
      render();
    });
  }

  /* ================================================================ */
  /* Scanner de código de barras (câmera)                              */
  /* Usa a BarcodeDetector API nativa quando disponível (Chrome/Edge/  */
  /* Android). Em navegadores sem suporte (principalmente Safari/iOS), */
  /* carrega a biblioteca html5-qrcode via CDN sob demanda.            */
  /* ================================================================ */

  var scanCtx = { stream: null, detectTimer: null, html5Qr: null };
  var loadedScripts = {};

  function loadScriptOnce(src) {
    if (!loadedScripts[src]) {
      loadedScripts[src] = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = function () { resolve(); };
        s.onerror = function () { reject(new Error("Falha ao carregar " + src)); };
        document.head.appendChild(s);
      });
    }
    return loadedScripts[src];
  }

  function openScanner(onDetected) {
    closeScanner();
    var overlay = document.createElement("div");
    overlay.className = "pc-modal-backdrop";
    overlay.id = "scanner-backdrop";
    overlay.innerHTML =
      '<div class="pc-modal pc-scanner-modal">' +
      '<div class="pc-modal-head"><h3>Escanear código de barras</h3>' +
      '<button class="pc-icon-btn" id="scanner-close">' + icon("x") + "</button></div>" +
      '<div class="pc-scanner-viewport" id="scanner-viewport">' +
      '<video id="scanner-video" class="pc-scanner-video" playsinline autoplay muted></video>' +
      '<div class="pc-scanner-frame"></div>' +
      "</div>" +
      '<p class="pc-scanner-status" id="scanner-status">Aponte a câmera para o código de barras do produto.</p>' +
      '<div class="pc-modal-actions">' +
      '<button type="button" class="pc-btn pc-btn-ghost" id="scanner-manual">Cadastrar manualmente</button>' +
      "</div></div>";
    document.body.appendChild(overlay);

    document.getElementById("scanner-close").addEventListener("click", closeScanner);
    document.getElementById("scanner-manual").addEventListener("click", closeScanner);
    overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) closeScanner(); });

    startScanning(onDetected);
  }

  function setScannerStatus(msg, isError) {
    var el = document.getElementById("scanner-status");
    if (el) {
      el.textContent = msg;
      el.style.color = isError ? "var(--red)" : "var(--muted)";
    }
  }

  function closeScanner() {
    if (scanCtx.detectTimer) {
      clearInterval(scanCtx.detectTimer);
      scanCtx.detectTimer = null;
    }
    if (scanCtx.html5Qr) {
      var lib = scanCtx.html5Qr;
      scanCtx.html5Qr = null;
      try {
        lib.stop().then(function () { try { lib.clear(); } catch (e) {} }).catch(function () {});
      } catch (e) {}
    }
    if (scanCtx.stream) {
      scanCtx.stream.getTracks().forEach(function (t) { t.stop(); });
      scanCtx.stream = null;
    }
    var overlay = document.getElementById("scanner-backdrop");
    if (overlay) overlay.remove();
  }

  function friendlyCameraError(err) {
    var name = err && err.name;
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "Permissão da câmera negada. Habilite o acesso à câmera nas configurações do navegador e tente novamente.";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return "Nenhuma câmera foi encontrada neste dispositivo.";
    }
    if (name === "NotReadableError") {
      return "Não foi possível acessar a câmera — ela pode estar em uso por outro aplicativo.";
    }
    if (name === "OverconstrainedError") {
      return "Não foi possível configurar a câmera traseira. Tente novamente.";
    }
    return "Não foi possível acessar a câmera. Use o cadastro manual.";
  }

  function startScanning(onDetected) {
    if (!window.isSecureContext) {
      setScannerStatus("A leitura por câmera exige uma conexão segura (https). Use o cadastro manual.", true);
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScannerStatus("Este navegador não tem suporte à câmera. Use o cadastro manual.", true);
      return;
    }
    if ("BarcodeDetector" in window) {
      startNativeScanner(onDetected);
    } else {
      startFallbackScanner(onDetected);
    }
  }

  function startNativeScanner(onDetected) {
    var video = document.getElementById("scanner-video");
    var formats = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "codabar", "itf"];
    var detector;
    try {
      detector = new window.BarcodeDetector({ formats: formats });
    } catch (e) {
      startFallbackScanner(onDetected);
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then(function (stream) {
        scanCtx.stream = stream;
        video.srcObject = stream;
        return video.play();
      })
      .then(function () {
        scanCtx.detectTimer = setInterval(function () {
          detector.detect(video).then(function (codes) {
            if (codes && codes.length > 0 && codes[0].rawValue) {
              var value = codes[0].rawValue;
              clearInterval(scanCtx.detectTimer);
              scanCtx.detectTimer = null;
              setScannerStatus("Código identificado: " + value);
              onDetected(value);
              closeScanner();
            }
          }).catch(function () { /* leitura falhou neste frame, tenta o próximo */ });
        }, 250);
      })
      .catch(function (err) {
        setScannerStatus(friendlyCameraError(err), true);
      });
  }

  function startFallbackScanner(onDetected) {
    setScannerStatus("Carregando leitor de código de barras...");
    loadScriptOnce("https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js")
      .then(function () {
        if (!window.Html5Qrcode) throw new Error("biblioteca indisponível");
        var viewport = document.getElementById("scanner-viewport");
        if (!viewport) return; // scanner foi fechado enquanto a lib carregava
        viewport.innerHTML = '<div id="scanner-fallback" style="width:100%"></div>';

        var supportedFormats = window.Html5QrcodeSupportedFormats;
        var formats = supportedFormats ? [
          supportedFormats.EAN_13, supportedFormats.EAN_8, supportedFormats.UPC_A,
          supportedFormats.UPC_E, supportedFormats.CODE_128, supportedFormats.CODE_39,
          supportedFormats.CODABAR, supportedFormats.ITF
        ] : undefined;

        var html5Qr = new window.Html5Qrcode("scanner-fallback", formats ? { formatsToSupport: formats, verbose: false } : { verbose: false });
        scanCtx.html5Qr = html5Qr;
        setScannerStatus("Aponte a câmera para o código de barras do produto.");

        html5Qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 150 } },
          function (decodedText) {
            setScannerStatus("Código identificado: " + decodedText);
            onDetected(decodedText);
            closeScanner();
          },
          function () { /* nenhum código neste frame, ignorar */ }
        ).catch(function (err) {
          setScannerStatus(friendlyCameraError(err), true);
        });
      })
      .catch(function () {
        setScannerStatus("Não foi possível carregar o leitor de código de barras. Verifique sua conexão ou digite o código manualmente.", true);
      });
  }

  /* ================================================================ */
  /* Modais: produto / movimentação / exclusão                        */
  /* ================================================================ */

  function renderModals() {
    var existing = document.getElementById("pc-modals");
    if (existing) existing.remove();

    var html = "";
    if (state.showStoresScreen) html += renderStoresScreen();
    if (state.storeModal) html += renderStoreFormModal();
    if (state.confirmDeleteStore) html += renderConfirmDeleteStoreModal();
    if (state.productModal) html += renderProductModal();
    if (state.moveModal) html += renderMoveModal();
    if (state.confirmDelete) html += renderConfirmDeleteModal();

    if (!html) return;

    var container = document.createElement("div");
    container.id = "pc-modals";
    container.innerHTML = html;
    document.body.appendChild(container);

    if (state.showStoresScreen) wireStoresScreen();
    if (state.storeModal) wireStoreFormModal();
    if (state.confirmDeleteStore) wireConfirmDeleteStoreModal();
    if (state.productModal) wireProductModal();
    if (state.moveModal) wireMoveModal();
    if (state.confirmDelete) wireConfirmDeleteModal();
  }

  function field(label, inputHtml) {
    return '<div class="pc-field"><label class="pc-label">' + label + "</label>" + inputHtml + "</div>";
  }

  function productImagePreviewHtml(url) {
    if (!url) return "";
    return (
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<img src="' + escapeHtml(url) + '" alt="" class="pc-thumb pc-thumb-lg" onerror="this.style.display=\'none\'"/>' +
      '<span class="pc-muted" style="font-size:12px">Imagem obtida automaticamente</span>' +
      "</div>"
    );
  }

  /* ================================================================ */
  /* Tela "Meus Estabelecimentos"                                      */
  /* ================================================================ */

  function renderStoresScreen() {
    var rows = state.stores.map(function (s) {
      var active = s.id === state.activeStoreId;
      return (
        '<div class="pc-store-row' + (active ? " active" : "") + '">' +
        '<span class="pc-store-dot pc-store-dot-lg" style="background:' + s.color + '">' + s.icon + "</span>" +
        '<div class="pc-store-row-info">' +
        '<div class="pc-store-row-name">' + escapeHtml(s.name) + (active ? ' <span class="pc-store-active-tag">ativo</span>' : "") + "</div>" +
        '<div class="pc-store-row-sub">Criado em ' + formatDate(new Date(s.createdAt).toISOString().slice(0, 10)) + "</div>" +
        "</div>" +
        '<div class="pc-cell-actions">' +
        (active ? "" : '<button class="pc-icon-btn" title="Usar este estabelecimento" data-use-store="' + s.id + '">' + icon("check") + "</button>") +
        '<button class="pc-icon-btn" title="Editar" data-edit-store="' + s.id + '">' + icon("edit") + "</button>" +
        '<button class="pc-icon-btn" title="Excluir" data-delete-store="' + s.id + '">' + icon("trash") + "</button>" +
        "</div></div>"
      );
    }).join("");

    return (
      '<div class="pc-modal-backdrop" id="stores-backdrop">' +
      '<div class="pc-modal pc-stores-modal">' +
      '<div class="pc-modal-head"><h3>Meus Estabelecimentos</h3>' +
      '<button class="pc-icon-btn" id="stores-close">' + icon("x") + "</button></div>" +
      '<p class="pc-muted" style="font-size:13px;margin-bottom:14px">Cada estabelecimento tem seus próprios produtos, estoque, validades e movimentações — nada é compartilhado entre eles.</p>' +
      '<div class="pc-store-list">' + rows + "</div>" +
      '<button class="pc-btn pc-btn-primary" id="stores-new" style="margin-top:14px;width:100%;justify-content:center">' + icon("plus") + " Novo estabelecimento</button>" +
      "</div></div>"
    );
  }

  function wireStoresScreen() {
    var close = function () { state.showStoresScreen = false; render(); };
    document.getElementById("stores-close").addEventListener("click", close);
    document.getElementById("stores-backdrop").addEventListener("mousedown", function (e) {
      if (e.target.id === "stores-backdrop") close();
    });
    document.getElementById("stores-new").addEventListener("click", function () {
      state.storeModal = emptyStore();
      render();
    });
    forEachEl("[data-use-store]", function (el) {
      el.addEventListener("click", function (e) {
        state.showStoresScreen = false;
        switchActiveStore(e.currentTarget.getAttribute("data-use-store"));
      });
    });
    forEachEl("[data-edit-store]", function (el) {
      el.addEventListener("click", function (e) {
        var s = findStore(e.currentTarget.getAttribute("data-edit-store"));
        if (s) { state.storeModal = s; render(); }
      });
    });
    forEachEl("[data-delete-store]", function (el) {
      el.addEventListener("click", function (e) {
        var s = findStore(e.currentTarget.getAttribute("data-delete-store"));
        if (s) { state.confirmDeleteStore = s; render(); }
      });
    });
  }

  function findStore(id) {
    for (var i = 0; i < state.stores.length; i++) { if (state.stores[i].id === id) return state.stores[i]; }
    return null;
  }

  function renderStoreFormModal() {
    var s = state.storeModal;
    var isEdit = !!s.id;
    var iconsHtml = STORE_ICONS.map(function (ic) {
      return '<button type="button" class="pc-emoji-btn' + (s.icon === ic ? " selected" : "") + '" data-pick-icon="' + ic + '">' + ic + "</button>";
    }).join("");
    var colorsHtml = STORE_COLORS.map(function (c) {
      return '<button type="button" class="pc-color-swatch' + (s.color === c ? " selected" : "") + '" data-pick-color="' + c + '" style="background:' + c + '"></button>';
    }).join("");

    return (
      '<div class="pc-modal-backdrop" id="store-form-backdrop">' +
      '<div class="pc-modal pc-modal-narrow">' +
      '<div class="pc-modal-head"><h3>' + (isEdit ? "Editar estabelecimento" : "Novo estabelecimento") + '</h3>' +
      '<button class="pc-icon-btn" id="store-form-close">' + icon("x") + "</button></div>" +
      '<form id="store-form">' +
      '<div class="pc-store-preview">' +
      '<span class="pc-store-dot pc-store-dot-lg" id="store-preview-dot" style="background:' + s.color + '">' + s.icon + "</span>" +
      "</div>" +
      field("Nome do estabelecimento *", '<input class="pc-input" id="sf-name" required value="' + escapeHtml(s.name) + '" placeholder="Ex.: Minimercado Torre A"/>') +
      field("Ícone", '<div class="pc-emoji-grid" id="sf-icon-grid">' + iconsHtml + "</div>") +
      field("Cor", '<div class="pc-color-grid" id="sf-color-grid">' + colorsHtml + "</div>") +
      '<input type="hidden" id="sf-icon" value="' + s.icon + '"/>' +
      '<input type="hidden" id="sf-color" value="' + s.color + '"/>' +
      '<div class="pc-modal-actions">' +
      '<button type="button" class="pc-btn pc-btn-ghost" id="store-form-cancel">Cancelar</button>' +
      '<button type="submit" class="pc-btn pc-btn-primary">Salvar estabelecimento</button>' +
      "</div></form></div></div>"
    );
  }

  function wireStoreFormModal() {
    var close = function () { state.storeModal = null; render(); };
    document.getElementById("store-form-close").addEventListener("click", close);
    document.getElementById("store-form-cancel").addEventListener("click", close);
    document.getElementById("store-form-backdrop").addEventListener("mousedown", function (e) {
      if (e.target.id === "store-form-backdrop") close();
    });

    function updatePreview() {
      var ic = document.getElementById("sf-icon").value;
      var col = document.getElementById("sf-color").value;
      var dot = document.getElementById("store-preview-dot");
      dot.textContent = ic;
      dot.style.background = col;
    }

    forEachEl("[data-pick-icon]", function (el) {
      el.addEventListener("click", function (e) {
        document.getElementById("sf-icon").value = e.currentTarget.getAttribute("data-pick-icon");
        forEachEl(".pc-emoji-btn", function (b) { b.classList.remove("selected"); });
        e.currentTarget.classList.add("selected");
        updatePreview();
      });
    });

    forEachEl("[data-pick-color]", function (el) {
      el.addEventListener("click", function (e) {
        document.getElementById("sf-color").value = e.currentTarget.getAttribute("data-pick-color");
        forEachEl(".pc-color-swatch", function (b) { b.classList.remove("selected"); });
        e.currentTarget.classList.add("selected");
        updatePreview();
      });
    });

    document.getElementById("store-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("sf-name").value.trim();
      if (!name) return;
      var s = state.storeModal;
      var updated = {
        id: s.id, name: name,
        icon: document.getElementById("sf-icon").value,
        color: document.getElementById("sf-color").value,
        createdAt: s.createdAt
      };
      var submitBtn = document.querySelector('#store-form button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      saveStore(updated);
    });
  }

  function renderConfirmDeleteStoreModal() {
    var s = state.confirmDeleteStore;
    return (
      '<div class="pc-modal-backdrop" id="del-store-backdrop">' +
      '<div class="pc-modal pc-modal-narrow">' +
      '<div class="pc-modal-head"><h3>Excluir estabelecimento</h3>' +
      '<button class="pc-icon-btn" id="del-store-close">' + icon("x") + "</button></div>" +
      '<p style="font-size:14px;margin-bottom:18px">Tem certeza que deseja excluir <strong>' + escapeHtml(s.name) + "</strong>? Todos os produtos, estoque e movimentações desse estabelecimento serão apagados permanentemente.</p>" +
      '<div class="pc-modal-actions">' +
      '<button class="pc-btn pc-btn-ghost" id="del-store-cancel">Cancelar</button>' +
      '<button class="pc-btn pc-btn-danger" id="del-store-confirm">Excluir estabelecimento</button>' +
      "</div></div></div>"
    );
  }

  function wireConfirmDeleteStoreModal() {
    var s = state.confirmDeleteStore;
    var close = function () { state.confirmDeleteStore = null; render(); };
    document.getElementById("del-store-close").addEventListener("click", close);
    document.getElementById("del-store-cancel").addEventListener("click", close);
    document.getElementById("del-store-backdrop").addEventListener("mousedown", function (e) {
      if (e.target.id === "del-store-backdrop") close();
    });
    document.getElementById("del-store-confirm").addEventListener("click", function () {
      document.getElementById("del-store-confirm").disabled = true;
      deleteStore(s);
    });
  }

  function renderProductModal() {
    var p = state.productModal;
    var isEdit = !!p.id;
    return (
      '<div class="pc-modal-backdrop" id="product-backdrop">' +
      '<div class="pc-modal">' +
      '<div class="pc-modal-head"><h3>' + (isEdit ? "Editar produto" : "Novo produto") + '</h3>' +
      '<button class="pc-icon-btn" id="product-close">' + icon("x") + "</button></div>" +
      '<form id="product-form">' +
      field("Código de barras",
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<input class="pc-input pc-mono" style="flex:1 1 160px" id="pf-barcode" placeholder="Ex.: 7891234567890" value="' + escapeHtml(p.barcode) + '"/>' +
        '<button type="button" class="pc-btn pc-btn-secondary" id="pf-scan">' + icon("camera") + " Escanear</button>" +
        '<button type="button" class="pc-btn pc-btn-secondary" id="pf-lookup">' + icon("barcode") + " Buscar</button>" +
        "</div>" +
        '<div id="pf-image-preview" style="margin-top:8px">' + (p.image ? productImagePreviewHtml(p.image) : "") + "</div>" +
        '<input type="hidden" id="pf-image" value="' + escapeHtml(p.image || "") + '"/>' +
        '<p id="pf-lookup-msg" class="pc-muted" style="font-size:12px;margin-top:6px"></p>'
      ) +
      field("Nome do produto *", '<input class="pc-input" id="pf-name" required value="' + escapeHtml(p.name) + '" placeholder="Ex.: Leite Integral 1L"/>') +
      '<div class="pc-row-2">' +
      field("Categoria", '<select class="pc-select" id="pf-category">' + CATEGORIAS.map(function (c) { return '<option value="' + c + '"' + (p.category === c ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select>") +
      field("Marca", '<input class="pc-input" id="pf-brand" value="' + escapeHtml(p.brand) + '" placeholder="Ex.: Piracanjuba"/>') +
      "</div>" +
      '<div class="pc-row-3">' +
      field("Unidade", '<select class="pc-select" id="pf-unit">' + UNIDADES.map(function (u) { return '<option value="' + u + '"' + (p.unit === u ? " selected" : "") + ">" + u + "</option>"; }).join("") + "</select>") +
      field("Estoque atual", '<input class="pc-input" type="number" min="0" id="pf-stock" value="' + p.stock + '"/>') +
      field("Estoque mínimo", '<input class="pc-input" type="number" min="0" id="pf-minstock" value="' + p.minStock + '"/>') +
      "</div>" +
      '<div class="pc-row-2">' +
      field("Data de fabricação (opcional)", '<input class="pc-input" type="date" id="pf-manufacture" value="' + p.manufactureDate + '"/>') +
      field("Data de vencimento *", '<input class="pc-input" type="date" required id="pf-expiry" value="' + p.expiryDate + '"/>') +
      "</div>" +
      field("Fornecedor (opcional)", '<input class="pc-input" id="pf-supplier" value="' + escapeHtml(p.supplier) + '" placeholder="Ex.: Distribuidora Central"/>') +
      field("Observações", '<textarea class="pc-textarea" rows="2" id="pf-notes" placeholder="Detalhes adicionais sobre o produto">' + escapeHtml(p.notes) + "</textarea>") +
      '<div class="pc-modal-actions">' +
      '<button type="button" class="pc-btn pc-btn-ghost" id="pf-cancel">Cancelar</button>' +
      '<button type="submit" class="pc-btn pc-btn-primary">Salvar produto</button>' +
      "</div></form></div></div>"
    );
  }

  function guessCategory(catStr) {
    if (!catStr) return null;
    var s = catStr.toLowerCase();
    if (s.indexOf("bebida") !== -1 || s.indexOf("drink") !== -1 || s.indexOf("suco") !== -1 || s.indexOf("refriger") !== -1) return "Bebidas";
    if (s.indexOf("leite") !== -1 || s.indexOf("iogurte") !== -1 || s.indexOf("queijo") !== -1 || s.indexOf("dairy") !== -1) return "Laticínios";
    if (s.indexOf("pão") !== -1 || s.indexOf("bread") !== -1 || s.indexOf("padaria") !== -1) return "Padaria";
    if (s.indexOf("snack") !== -1 || s.indexOf("batata") !== -1 || s.indexOf("chips") !== -1) return "Snacks";
    if (s.indexOf("limpeza") !== -1 || s.indexOf("clean") !== -1) return "Limpeza";
    if (s.indexOf("higiene") !== -1 || s.indexOf("hygiene") !== -1) return "Higiene";
    if (s.indexOf("congelado") !== -1 || s.indexOf("frozen") !== -1) return "Congelados";
    if (s.indexOf("doce") !== -1 || s.indexOf("chocolate") !== -1 || s.indexOf("candy") !== -1) return "Doces";
    return "Mercearia";
  }

  /** Consulta a Open Food Facts e devolve {name, brand, category, image} ou null se não encontrado. */
  function fetchProductByBarcode(barcode) {
    return fetch("https://world.openfoodfacts.org/api/v2/product/" + barcode + ".json")
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (json && json.status === 1 && json.product) {
          var prod = json.product;
          return {
            name: prod.product_name_pt || prod.product_name || "",
            brand: (prod.brands || "").split(",")[0].trim(),
            category: guessCategory(prod.categories),
            image: prod.image_front_small_url || prod.image_front_url || prod.image_url || ""
          };
        }
        return null;
      });
  }

  /** Executa a busca do produto e preenche o formulário aberto (usada pela busca manual e pelo scanner). */
  function runProductLookup(barcode) {
    if (!barcode) return;
    var msg = document.getElementById("pf-lookup-msg");
    var btn = document.getElementById("pf-lookup");
    if (btn) btn.disabled = true;
    if (msg) msg.textContent = "Consultando...";
    fetchProductByBarcode(barcode)
      .then(function (info) {
        if (info) {
          if (info.name) document.getElementById("pf-name").value = info.name;
          if (info.brand) document.getElementById("pf-brand").value = info.brand;
          if (info.category) document.getElementById("pf-category").value = info.category;
          if (info.image) {
            document.getElementById("pf-image").value = info.image;
            var preview = document.getElementById("pf-image-preview");
            if (preview) preview.innerHTML = productImagePreviewHtml(info.image);
          }
          if (msg) msg.textContent = "Produto encontrado — confira os dados e informe a validade e a quantidade.";
          showToast("Produto identificado! Falta só a validade e a quantidade.");
          var expiryEl = document.getElementById("pf-expiry");
          if (expiryEl) expiryEl.focus();
        } else if (msg) {
          msg.textContent = "Código não encontrado. Preencha os dados manualmente.";
        }
      })
      .catch(function () {
        if (msg) msg.textContent = "Não foi possível consultar agora. Preencha os dados manualmente.";
      })
      .finally(function () { if (btn) btn.disabled = false; });
  }

  function wireProductModal() {
    var close = function () { closeScanner(); state.productModal = null; render(); };
    document.getElementById("product-close").addEventListener("click", close);
    document.getElementById("pf-cancel").addEventListener("click", close);
    document.getElementById("product-backdrop").addEventListener("mousedown", function (e) {
      if (e.target.id === "product-backdrop") close();
    });

    document.getElementById("pf-barcode").addEventListener("input", function (e) {
      e.target.value = e.target.value.replace(/\D/g, "");
    });

    document.getElementById("pf-lookup").addEventListener("click", function () {
      runProductLookup(document.getElementById("pf-barcode").value);
    });

    document.getElementById("pf-scan").addEventListener("click", function () {
      openScanner(function (code) {
        document.getElementById("pf-barcode").value = code;
        runProductLookup(code);
      });
    });

    if (state.pendingAutoLookup) {
      var autoCode = state.pendingAutoLookup;
      state.pendingAutoLookup = null;
      runProductLookup(autoCode);
    }

    document.getElementById("product-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("pf-name").value.trim();
      var expiry = document.getElementById("pf-expiry").value;
      if (!name || !expiry) return;

      var p = state.productModal;
      var isEdit = isEditFlag(p);
      var updated = {
        id: p.id,
        storeId: p.storeId || state.activeStoreId,
        barcode: document.getElementById("pf-barcode").value,
        name: name,
        category: document.getElementById("pf-category").value,
        brand: document.getElementById("pf-brand").value,
        unit: document.getElementById("pf-unit").value,
        stock: Number(document.getElementById("pf-stock").value) || 0,
        minStock: Number(document.getElementById("pf-minstock").value) || 0,
        manufactureDate: document.getElementById("pf-manufacture").value,
        expiryDate: expiry,
        supplier: document.getElementById("pf-supplier").value,
        notes: document.getElementById("pf-notes").value,
        image: document.getElementById("pf-image").value || "",
        createdAt: p.createdAt || Date.now()
      };

      var submitBtn = document.querySelector('#product-form button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      if (DB_MODE === "supabase") {
        var query = isEdit
          ? supa.from("products").update(productToRow(updated)).eq("id", updated.id).select().single()
          : supa.from("products").insert(productToRow(updated)).select().single();

        query.then(function (res) {
          if (res.error) throw res.error;
          upsertProductLocal(rowToProduct(res.data));
          cacheLocalSnapshot();
          state.productModal = null;
          showToast(isEdit ? "Produto atualizado." : "Produto cadastrado.");
          render();
        }).catch(function (err) {
          console.error("Falha ao salvar produto no Supabase", err);
          if (submitBtn) submitBtn.disabled = false;
          showToast("Não foi possível salvar no banco de dados. Verifique sua conexão e tente novamente.");
        });
      } else {
        if (isEdit) {
          localProductsAll = localProductsAll.map(function (item) { return item.id === updated.id ? updated : item; });
        } else {
          updated.id = uid();
          localProductsAll.push(updated);
        }
        saveLocalAll();
        refilterLocalToActiveStore();
        state.productModal = null;
        showToast(isEdit ? "Produto atualizado." : "Produto cadastrado.");
        render();
      }
    });
  }

  function isEditFlag(p) { return !!p.id; }

  function renderMoveModal() {
    var p = state.moveModal;
    return (
      '<div class="pc-modal-backdrop" id="move-backdrop">' +
      '<div class="pc-modal">' +
      '<div class="pc-modal-head"><h3>Movimentar estoque</h3>' +
      '<button class="pc-icon-btn" id="move-close">' + icon("x") + "</button></div>" +
      '<form id="move-form">' +
      '<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;background:var(--paper);padding:10px 12px;border-radius:10px">' +
      icon("package") +
      '<div><div style="font-weight:700">' + escapeHtml(p.name) + '</div><div class="pc-muted" style="font-size:12px">Estoque atual: ' + p.stock + " " + escapeHtml(p.unit) + "</div></div></div>" +
      field("Tipo de movimentação",
        '<div class="pc-type-grid">' +
        '<button type="button" class="pc-type-btn active-entrada" data-type="entrada" id="mt-entrada">' + icon("down") + "Entrada</button>" +
        '<button type="button" class="pc-type-btn" data-type="saida" id="mt-saida">' + icon("up") + "Saída</button>" +
        '<button type="button" class="pc-type-btn" data-type="ajuste" id="mt-ajuste">' + icon("wrench") + "Ajuste</button>" +
        "</div>"
      ) +
      field('<span id="mv-qty-label">Quantidade</span>', '<input class="pc-input" type="number" min="0" id="mv-qty" placeholder="0"/>') +
      field("Observação (opcional)", '<input class="pc-input" id="mv-note" placeholder="Ex.: Reposição semanal, produto danificado..."/>') +
      '<div class="pc-modal-actions">' +
      '<button type="button" class="pc-btn pc-btn-ghost" id="mv-cancel">Cancelar</button>' +
      '<button type="submit" class="pc-btn pc-btn-primary">Confirmar movimentação</button>' +
      "</div></form></div></div>"
    );
  }

  function wireMoveModal() {
    var p = state.moveModal;
    var currentType = "entrada";
    var close = function () { state.moveModal = null; render(); };
    document.getElementById("move-close").addEventListener("click", close);
    document.getElementById("mv-cancel").addEventListener("click", close);
    document.getElementById("move-backdrop").addEventListener("mousedown", function (e) {
      if (e.target.id === "move-backdrop") close();
    });

    function setType(type) {
      currentType = type;
      ["entrada", "saida", "ajuste"].forEach(function (t) {
        var btn = document.getElementById("mt-" + t);
        btn.className = "pc-type-btn" + (t === type ? " active-" + t : "");
      });
      var label = document.getElementById("mv-qty-label");
      var qtyInput = document.getElementById("mv-qty");
      if (type === "ajuste") {
        label.textContent = "Novo valor de estoque";
        qtyInput.placeholder = "Atual: " + p.stock;
      } else {
        label.textContent = "Quantidade";
        qtyInput.placeholder = "0";
      }
    }

    document.getElementById("mt-entrada").addEventListener("click", function () { setType("entrada"); });
    document.getElementById("mt-saida").addEventListener("click", function () { setType("saida"); });
    document.getElementById("mt-ajuste").addEventListener("click", function () { setType("ajuste"); });

    document.getElementById("move-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var qtyRaw = document.getElementById("mv-qty").value;
      var note = document.getElementById("mv-note").value;
      if (qtyRaw === "") return;
      var qty = Number(qtyRaw);

      var previousStock = p.stock;
      var newStock = previousStock;
      if (currentType === "entrada") newStock = previousStock + qty;
      else if (currentType === "saida") newStock = Math.max(0, previousStock - qty);
      else if (currentType === "ajuste") newStock = qty;

      var movement = {
        storeId: p.storeId || state.activeStoreId, productId: p.id, productName: p.name, type: currentType,
        quantity: currentType === "ajuste" ? Math.abs(newStock - previousStock) : qty,
        previousStock: previousStock, newStock: newStock, note: note, timestamp: Date.now()
      };

      var submitBtn = document.querySelector('#move-form button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      if (DB_MODE === "supabase") {
        supa.from("products").update({ stock: newStock }).eq("id", p.id).select().single()
          .then(function (res) {
            if (res.error) throw res.error;
            upsertProductLocal(rowToProduct(res.data));
            return supa.from("movements").insert(movementToRow(movement)).select().single();
          })
          .then(function (res) {
            if (res.error) throw res.error;
            upsertMovementLocal(rowToMovement(res.data));
            cacheLocalSnapshot();
            state.moveModal = null;
            showToast("Movimentação registrada.");
            render();
          })
          .catch(function (err) {
            console.error("Falha ao registrar movimentação no Supabase", err);
            if (submitBtn) submitBtn.disabled = false;
            showToast("Não foi possível registrar no banco de dados. Verifique sua conexão e tente novamente.");
          });
      } else {
        localProductsAll = localProductsAll.map(function (item) {
          return item.id === p.id ? Object.assign({}, item, { stock: newStock }) : item;
        });
        movement.id = uid();
        localMovementsAll = [movement].concat(localMovementsAll);
        saveLocalAll();
        refilterLocalToActiveStore();
        state.moveModal = null;
        showToast("Movimentação registrada.");
        render();
      }
    });
  }

  function renderConfirmDeleteModal() {
    var p = state.confirmDelete;
    return (
      '<div class="pc-modal-backdrop" id="del-backdrop">' +
      '<div class="pc-modal pc-modal-narrow">' +
      '<div class="pc-modal-head"><h3>Excluir produto</h3>' +
      '<button class="pc-icon-btn" id="del-close">' + icon("x") + "</button></div>" +
      '<p style="font-size:14px;margin-bottom:18px">Tem certeza que deseja excluir <strong>' + escapeHtml(p.name) + "</strong>? O histórico de movimentações desse produto também será removido.</p>" +
      '<div class="pc-modal-actions">' +
      '<button class="pc-btn pc-btn-ghost" id="del-cancel">Cancelar</button>' +
      '<button class="pc-btn pc-btn-danger" id="del-confirm">Excluir produto</button>' +
      "</div></div></div>"
    );
  }

  function wireConfirmDeleteModal() {
    var p = state.confirmDelete;
    var close = function () { state.confirmDelete = null; render(); };
    document.getElementById("del-close").addEventListener("click", close);
    document.getElementById("del-cancel").addEventListener("click", close);
    document.getElementById("del-backdrop").addEventListener("mousedown", function (e) {
      if (e.target.id === "del-backdrop") close();
    });
    document.getElementById("del-confirm").addEventListener("click", function () {
      var delBtn = document.getElementById("del-confirm");
      delBtn.disabled = true;

      if (DB_MODE === "supabase") {
        supa.from("products").delete().eq("id", p.id)
          .then(function (res) {
            if (res.error) throw res.error;
            state.products = state.products.filter(function (item) { return item.id !== p.id; });
            state.movements = state.movements.filter(function (m) { return m.productId !== p.id; });
            cacheLocalSnapshot();
            state.confirmDelete = null;
            showToast("Produto excluído.");
            render();
          })
          .catch(function (err) {
            console.error("Falha ao excluir produto no Supabase", err);
            delBtn.disabled = false;
            showToast("Não foi possível excluir no banco de dados. Verifique sua conexão e tente novamente.");
          });
      } else {
        localProductsAll = localProductsAll.filter(function (item) { return item.id !== p.id; });
        localMovementsAll = localMovementsAll.filter(function (m) { return m.productId !== p.id; });
        saveLocalAll();
        refilterLocalToActiveStore();
        state.confirmDelete = null;
        showToast("Produto excluído.");
        render();
      }
    });
  }

  /* ================================================================ */
  /* PWA: instalação e service worker                                  */
  /* ================================================================ */

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    state.deferredInstallPrompt = e;
    render();
  });

  window.addEventListener("appinstalled", function () {
    state.deferredInstallPrompt = null;
    showToast("Prazo Certo instalado com sucesso.");
  });

  if ("serviceWorker" in navigator) {
    var swRefreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (swRefreshing) return;
      swRefreshing = true;
      window.location.reload();
    });

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js")
        .then(function (reg) {
          // Se já existir uma versão nova instalada e esperando, ativa na hora
          if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
          reg.addEventListener("updatefound", function () {
            var installing = reg.installing;
            if (!installing) return;
            installing.addEventListener("statechange", function () {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                installing.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
          // Verifica se há uma versão nova publicada logo na abertura do app
          reg.update().catch(function () {});
        })
        .catch(function (err) {
          console.error("Falha ao registrar service worker", err);
        });
    });
  }

  /* ================================================================ */
  /* Boot                                                              */
  /* ================================================================ */

  document.addEventListener("DOMContentLoaded", function () {
    var boot = document.getElementById("splash-boot");
    var app = document.getElementById("app");
    function revealApp() {
      if (boot) boot.style.display = "none";
      if (app) app.hidden = false;
    }

    if (DB_MODE === "supabase") {
      connStatus = "connecting";
      window.addEventListener("online", function () { setConnStatus("online"); });
      window.addEventListener("offline", function () { setConnStatus("offline"); });

      ensureAuth()
        .then(function () { return loadStoresFromSupabase(); })
        .then(function () {
          state.activeStoreId = resolveActiveStoreId(state.stores);
          persistActiveStoreId();
          return loadStoreScopedDataFromSupabase(state.activeStoreId);
        })
        .then(function () {
          connStatus = "online";
          render();
          subscribeRealtimeForStore(state.activeStoreId);
          subscribeStoresRealtime();
        })
        .catch(function (err) {
          console.error("Falha ao conectar ao Supabase", err);
          loadLocalStores();
          if (!state.stores.length) {
            connStatus = "offline";
            render();
            showToast("Não foi possível conectar ao banco de dados. Verifique js/supabase-config.js.");
            return;
          }
          state.activeStoreId = resolveActiveStoreId(state.stores);
          var hadCache = loadLocalSnapshotIntoState();
          connStatus = "offline";
          render();
          showToast(hadCache
            ? "Sem conexão com o banco — mostrando os últimos dados sincronizados."
            : "Não foi possível conectar ao banco de dados. Verifique js/supabase-config.js.");
        })
        .finally(function () {
          setTimeout(revealApp, 300);
        });
    } else {
      loadLocalStores();
      if (state.stores.length === 0) {
        var defaultStore = { id: uid(), name: "Meu Estabelecimento", icon: "🏪", color: STORE_COLORS[0], createdAt: Date.now() };
        state.stores = [defaultStore];
        saveLocalStores();
      }
      state.activeStoreId = resolveActiveStoreId(state.stores);
      persistActiveStoreId();
      loadLocalAll();
      refilterLocalToActiveStore();
      render();
      setTimeout(revealApp, 350);
    }
  });
})();
