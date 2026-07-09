(function () {
  "use strict";

  /* ================================================================ */
  /* Constantes                                                        */
  /* ================================================================ */

  var STORAGE_KEY = "prazoCertoData";

  var CATEGORIAS = ["Bebidas", "Snacks", "Laticínios", "Padaria", "Higiene", "Limpeza", "Congelados", "Doces", "Mercearia", "Outros"];
  var UNIDADES = ["un", "kg", "g", "L", "ml", "cx", "pct", "dz"];

  var STATUS_META = {
    vencido: { label: "Vencido", color: "var(--red)", bg: "var(--red-bg)", icon: "alert" },
    critico: { label: "Vence em breve", color: "var(--amber-strong)", bg: "var(--amber-bg)", icon: "clock" },
    atencao: { label: "Atenção", color: "var(--amber)", bg: "var(--amber-bg)", icon: "clock" },
    ok: { label: "Dentro da validade", color: "var(--green)", bg: "var(--green-bg)", icon: "check" }
  };

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
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5-4 4-2-2-5 5"/>'
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

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        state.products = parsed.products || [];
        state.movements = parsed.movements || [];
      }
    } catch (e) {
      console.error("Falha ao carregar dados salvos", e);
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ products: state.products, movements: state.movements }));
    } catch (e) {
      console.error("Falha ao salvar dados", e);
      showToast("Não foi possível salvar as alterações neste dispositivo.");
    }
  }

  function emptyProduct() {
    return {
      id: null, barcode: "", name: "", category: CATEGORIAS[0], brand: "", unit: "un",
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
      obj.createdAt = now - i * 1000;
      return obj;
    });
    var movements = products.slice(0, 4).map(function (p, i) {
      return {
        id: uid(), productId: p.id, productName: p.name, type: "entrada",
        quantity: p.stock, previousStock: 0, newStock: p.stock,
        note: "Carga inicial (exemplo)", timestamp: now - (i + 1) * 3600000
      };
    });
    return { products: products, movements: movements };
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
      '<div class="pc-subtitle">Controle de validade — minimercado autônomo</div></div>' +
      "</div>" +
      (state.products.length === 0
        ? '<button class="pc-btn pc-btn-secondary" data-action="load-demo">Carregar dados de exemplo</button>'
        : "") +
      "</header>"
    );
  }

  function wireHeader() {
    var btn = document.querySelector('[data-action="load-demo"]');
    if (btn) btn.addEventListener("click", function () {
      var demo = buildDemoData();
      state.products = demo.products;
      state.movements = demo.movements;
      save();
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
    if (state.productModal) html += renderProductModal();
    if (state.moveModal) html += renderMoveModal();
    if (state.confirmDelete) html += renderConfirmDeleteModal();

    if (!html) return;

    var container = document.createElement("div");
    container.id = "pc-modals";
    container.innerHTML = html;
    document.body.appendChild(container);

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
      var updated = {
        id: p.id,
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

      if (updated.id) {
        state.products = state.products.map(function (item) { return item.id === updated.id ? updated : item; });
      } else {
        updated.id = uid();
        state.products.push(updated);
      }
      save();
      state.productModal = null;
      showToast(updated.id && isEditFlag(p) ? "Produto atualizado." : "Produto cadastrado.");
      render();
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

      state.products = state.products.map(function (item) {
        return item.id === p.id ? Object.assign({}, item, { stock: newStock }) : item;
      });

      var movement = {
        id: uid(), productId: p.id, productName: p.name, type: currentType,
        quantity: currentType === "ajuste" ? Math.abs(newStock - previousStock) : qty,
        previousStock: previousStock, newStock: newStock, note: note, timestamp: Date.now()
      };
      state.movements = [movement].concat(state.movements);
      save();
      state.moveModal = null;
      showToast("Movimentação registrada.");
      render();
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
      state.products = state.products.filter(function (item) { return item.id !== p.id; });
      state.movements = state.movements.filter(function (m) { return m.productId !== p.id; });
      save();
      state.confirmDelete = null;
      showToast("Produto excluído.");
      render();
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
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function (err) {
        console.error("Falha ao registrar service worker", err);
      });
    });
  }

  /* ================================================================ */
  /* Boot                                                              */
  /* ================================================================ */

  document.addEventListener("DOMContentLoaded", function () {
    load();
    render();
    var boot = document.getElementById("splash-boot");
    var app = document.getElementById("app");
    setTimeout(function () {
      if (boot) boot.style.display = "none";
      if (app) app.hidden = false;
    }, 350);
  });
})();
