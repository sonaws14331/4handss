import {
  createIcons,
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ChartPie,
  Coins,
  Download,
  Ellipsis,
  Flame,
  FlaskConical,
  Info,
  Layers,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessagesSquare,
  Save,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sprout,
  Star,
  TrendingUp,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide";
const icons = {
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ChartPie,
  Coins,
  Download,
  Ellipsis,
  Flame,
  FlaskConical,
  Info,
  Layers,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessagesSquare,
  Save,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sprout,
  Star,
  TrendingUp,
  Users,
  Wallet,
  X,
  Zap,
};
import "./style.css";

const $ = (s) => document.querySelector(s);
const icon = (name, cls = "") => `<i data-lucide="${name}" class="${cls}"></i>`;
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const base = import.meta.env.BASE_URL;
const assets = [
  {
    symbol: "AMBR",
    name: "AMBER",
    price: 0.00248,
    change: 12.84,
    volume: "128.4K",
    color: "amber",
    glyph: "A",
    points: [26, 25, 30, 24, 35, 32, 42, 38, 46, 42, 54, 50, 66],
  },
  {
    symbol: "BNB",
    name: "BNB",
    price: 612.35,
    change: 2.16,
    volume: "1.24B",
    color: "gold",
    glyph: "◇",
    points: [20, 29, 24, 36, 32, 40, 36, 43, 40, 47, 52, 48, 58],
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 67432.8,
    change: 1.42,
    volume: "24.68B",
    color: "orange",
    glyph: "₿",
    points: [20, 28, 25, 34, 31, 44, 38, 42, 46, 43, 52, 48, 56],
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 3521.64,
    change: -0.68,
    volume: "12.42B",
    color: "purple",
    glyph: "◆",
    points: [58, 48, 52, 42, 46, 36, 41, 32, 38, 24, 29, 21, 23],
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    price: 0.1426,
    change: 4.32,
    volume: "842.6M",
    color: "sand",
    glyph: "Ð",
    points: [19, 25, 22, 32, 27, 38, 35, 43, 40, 49, 46, 54, 61],
  },
];
function savedFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem("amber-favorites") || "[]");
    return Array.isArray(saved)
      ? saved.filter((v) => assets.some((a) => a.symbol === v))
      : [];
  } catch {
    return [];
  }
}
const state = {
  page: location.hash.slice(1) || "overview",
  period: "1D",
  filter: "All assets",
  query: "",
  favorites: new Set(savedFavorites()),
  wallet: null,
  settings: {
    announcement: "The next chapter starts with us.",
    contractAddress: "",
    communityUrl: "",
    tokenOwner: "",
    network: "testnet",
  },
  session: false,
};
const navItems = [
  ["overview", "layout-dashboard", "Overview"],
  ["markets", "chart-no-axes-combined", "Markets"],
  ["portfolio", "wallet", "My portfolio"],
  ["swap", "arrow-left-right", "Swap"],
  ["earn", "sprout", "Earn"],
];
let deferredInstall;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstall = e;
});
function refreshIcons() {
  createIcons({ icons, attrs: { "stroke-width": 1.7 } });
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 4200);
}
function modal(content) {
  $("#modal").innerHTML =
    `<button class="modal-close icon-button" data-action="close" aria-label="Close dialog">${icon("x")}</button>${content}`;
  $("#modal").showModal();
  refreshIcons();
}
function money(n) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n < 1 ? 5 : 2,
    maximumFractionDigits: n < 1 ? 5 : 2,
  });
}
function token(a, small = false) {
  return `<span class="token ${a.color} ${small ? "small" : ""}">${a.glyph}</span>`;
}
function spark(a) {
  return `<svg class="spark" viewBox="0 0 110 45" aria-hidden="true"><polyline points="${a.points.map((n, i) => `${i * 9},${45 - n * 0.55}`).join(" ")}" fill="none" stroke="${a.change < 0 ? "#e35e69" : "#27a988"}" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
}
function shell() {
  $("#app").innerHTML =
    `<aside class="sidebar"><a class="brand" href="#overview"><span class="brand-mark">A<span></span></span>AMBER<span class="brand-dot">®</span></a><div class="workspace-label">YOUR WEB3 STARTS HERE</div><nav aria-label="Main navigation">${navItems.map(([id, i, label]) => `<a href="#${id}" class="nav-item ${state.page === id ? "active" : ""}">${icon(i)}<span>${label}</span>${id === "swap" ? '<span class="nav-new">NEW</span>' : ""}</a>`).join("")}</nav><div class="nav-divider"></div><div class="workspace-label second-label">THE ECOSYSTEM</div><nav aria-label="Ecosystem"><a class="nav-item ${state.page === "tokenomics" ? "active" : ""}" href="#tokenomics">${icon("chart-pie")}Tokenomics</a><a class="nav-item ${state.page === "whitepaper" ? "active" : ""}" href="#whitepaper">${icon("book-open")}Whitepaper${icon("arrow-up-right", "tiny")}</a><button class="nav-item" data-action="community">${icon("users")}Community${icon("arrow-up-right", "tiny")}</button></nav><div class="sidebar-bottom"><div class="app-promo"><div class="app-promo-icon">${icon("smartphone")}<span>↗</span></div><strong>Your AMBER.<br>Everywhere you go.</strong><p>Take the community with you.</p><button data-action="install">Get the app ${icon("arrow-right")}</button></div><a class="nav-item admin-link ${state.page === "admin" ? "active" : ""}" href="#admin">${icon("settings-2")}Admin panel${icon("lock-keyhole", "tiny")}</a><div class="sidebar-status"><span></span> Built on BNB Smart Chain</div></div></aside><button class="mobile-backdrop" data-action="close-menu" aria-label="Close navigation"></button><div class="app-main"><header class="topbar"><button class="icon-button mobile-menu" data-action="menu" aria-label="Toggle navigation">${icon("menu")}</button><div class="breadcrumb">Ecosystem <span>/</span> <strong>${esc(state.page === "overview" ? "Overview" : state.page === "portfolio" ? "My portfolio" : state.page.charAt(0).toUpperCase() + state.page.slice(1))}</strong></div><div class="top-actions"><span class="network-pill"><span class="bnb-mini">◇</span> BNB Chain <span class="status-dot"></span></span><button class="icon-button notification" data-action="notifications" aria-label="Announcements">${icon("bell")}<span></span></button><div class="top-divider"></div><button class="wallet-button" data-action="wallet">${icon("wallet")}<span>${state.wallet ? state.wallet.slice(0, 6) + "…" + state.wallet.slice(-4) : "Connect wallet"}</span></button></div></header><main id="content"></main><footer><span>© ${new Date().getFullYear()} AMBER. Built for the community.</span><div><button data-action="risk">Risk disclosure</button><span class="footer-sep">·</span><a href="#whitepaper">Documentation</a><span class="footer-network"><span class="status-dot"></span> Pre-launch</span></div></footer></div>`;
  renderPage();
  refreshIcons();
}
function heading(title, subtitle, action = "") {
  return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`;
}
function overview() {
  return `${heading("A little spark. A bigger community.", "Welcome to AMBER. Your gateway to our growing ecosystem.", `<span class="date-label">${icon("calendar-days")} ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>`)}
<section class="hero"><div class="hero-grid"></div><div class="hero-copy"><div class="hero-eyebrow"><span></span> COMMUNITY-POWERED. BSC-BUILT.</div><h2>Small token.<br><span>Big amber energy.</span></h2><p>A meme with a mission. A community with a spark.<br> Meet AMBR — the heart of the AMBER ecosystem.</p><div class="hero-buttons"><button class="button dark" data-action="buy">Explore AMBR ${icon("arrow-up-right")}</button><a class="hero-learn" href="#whitepaper">Get to know us ${icon("arrow-right")}</a></div><div class="hero-footnote"><span>◇</span> BNB Smart Chain <b>•</b> BEP-20 Token <b>•</b> Community first</div></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="floating-star star-one">✦</div><div class="floating-star star-two">✧</div><div class="coin coin-back">A</div><div class="coin coin-front"><div class="coin-rim"><span class="coin-top">THE COMMUNITY TOKEN</span><div class="coin-letter">A<span></span></div><span class="coin-bottom">★ &nbsp; A M B E R &nbsp; ★</span></div></div><div class="art-chip chip-top"><span class="status-dot"></span> A new kind of energy</div><div class="art-chip chip-bottom">${icon("zap")} Powered by community</div><div class="art-floor"></div></div></section>
<div class="market-context"><span>${icon("flask-conical")} Ecosystem preview</span><p>Illustrative market data. AMBR is not live or available to trade.</p></div>
<section class="stat-grid">${[
    ["AMBR price", "$0.00248", "+12.84%", "vs. previous day", "coins"],
    [
      "Market cap",
      "$2.48M",
      "+12.84%",
      "illustrative valuation",
      "chart-no-axes-combined",
    ],
    [
      "24h volume",
      "$128.4K",
      "+8.62%",
      "illustrative activity",
      "arrow-left-right",
    ],
    [
      "Total supply",
      "1,000,000,000",
      "Fixed supply",
      "AMBR on BNB Chain",
      "layers",
    ],
  ]
    .map(
      ([label, value, badge, sub, i], idx) =>
        `<article class="stat-card"><div class="stat-label">${label}${icon(i)}</div><strong>${value}<span>${idx === 3 ? "AMBR" : ""}</span></strong><div class="stat-bottom"><span class="${idx === 3 ? "neutral-badge" : "positive-badge"}">${idx === 3 ? icon("lock-keyhole") : icon("trending-up")}${badge}</span><small>${sub}</small></div></article>`,
    )
    .join("")}</section>
<div class="dashboard-grid"><section class="panel chart-panel"><div class="panel-heading"><div class="chart-title">${token(assets[0], true)}<h3>AMBER <span>AMBR / USD</span></h3><span class="demo-tag">DEMO</span></div><button class="icon-button" data-action="chart-info" aria-label="About this chart">${icon("ellipsis")}</button></div><div class="chart-toolbar"><div><strong class="chart-price">$0.00248</strong><span class="positive-text">↗ 12.84%</span></div><div class="periods">${["1H", "1D", "1W", "1M", "1Y", "ALL"].map((p) => `<button data-period="${p}" class="${p === state.period ? "selected" : ""}">${p}</button>`).join("")}</div></div><div id="price-chart">${chart()}</div><div class="chart-caption"><span><span class="chart-dot"></span> AMBR price</span><span>Illustrative data · USD</span></div></section><section class="panel quick-swap"><div class="panel-heading"><h3>Quick swap</h3><span class="swap-icon">${icon("arrow-left-right")}</span></div>${swapForm(true)}</section></div>
<section class="panel markets-panel"><div class="panel-heading"><h3>Explore the market <span class="demo-tag">DEMO</span></h3><a class="text-link" href="#markets">View all markets ${icon("arrow-up-right")}</a></div><div class="market-tools"><div class="tabs">${["All assets", "Trending", "Favorites"].map((v) => `<button data-filter="${v}" class="${state.filter === v ? "selected" : ""}">${v === "Trending" ? icon("flame") : ""}${v}</button>`).join("")}</div><label class="search-field">${icon("search")}<input type="search" id="asset-search" placeholder="Search assets" aria-label="Search assets" value="${esc(state.query)}" /></label></div><div id="market-table">${marketTable()}</div></section>
<section class="bottom-grid"><a href="#tokenomics" class="discover-card"><div class="discover-icon peach">${icon("chart-pie")}</div><div><h3>Designed for the long run</h3><p>One billion AMBR. One shared vision.</p><span>Explore tokenomics ${icon("arrow-up-right")}</span></div><div class="mini-donut"></div></a><button class="discover-card community-card" data-action="community"><div class="discover-icon pale">${icon("messages-square")}</div><div><h3>Good energy. Great company.</h3><p>Help shape what AMBER becomes next.</p><span>Meet the community ${icon("arrow-up-right")}</span></div><div class="community-art">✳</div></button></section>`;
}
function chart() {
  const sequences = {
    "1H": [105, 110, 92, 97, 75, 85, 55, 63, 49, 68, 54, 32, 42, 35, 40],
    "1D": [
      162, 155, 166, 135, 141, 143, 122, 124, 143, 126, 134, 92, 105, 90, 98,
      66, 73, 70, 49, 60, 52, 67, 33, 43, 26, 46, 40,
    ],
    "1W": [174, 144, 154, 100, 124, 85, 104, 60, 87, 44, 55, 38],
    "1M": [180, 162, 173, 151, 153, 104, 133, 79, 100, 72, 81, 35],
    "1Y": [187, 174, 181, 159, 171, 132, 143, 91, 106, 70, 79, 35],
    ALL: [188, 185, 179, 175, 182, 159, 153, 163, 113, 128, 76, 98, 43, 35],
  };
  const vals = sequences[state.period];
  const points = vals
    .map((v, i) => `${30 + i * (680 / (vals.length - 1))},${v}`)
    .join(" ");
  return `<svg viewBox="0 0 800 245" role="img" aria-label="Illustrative AMBR price chart for ${state.period}. Not live market data."><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3b641" stop-opacity=".25"/><stop offset="1" stop-color="#f3b641" stop-opacity="0"/></linearGradient></defs>${[36, 79, 122, 165, 208].map((v, i) => `<line x1="25" y1="${v}" x2="713" y2="${v}" stroke="#edf0f3" stroke-dasharray="4 4"/><text x="732" y="${v + 4}" class="chart-axis">${(0.0026 - i * 0.0002).toFixed(4)}</text>`).join("")}<polygon points="30,210 ${points} 710,210" fill="url(#chart-fill)"/><polyline points="${points}" fill="none" stroke="#e9a323" stroke-width="2.5" stroke-linejoin="round"/><line x1="710" y1="${vals.at(-1)}" x2="726" y2="${vals.at(-1)}" stroke="#e9a323" stroke-dasharray="3 3"/><circle cx="710" cy="${vals.at(-1)}" r="4" fill="#e9a323" stroke="white" stroke-width="2"/>${["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"].map((v, i) => `<text x="${25 + i * 132}" y="239" class="chart-axis">${state.period === "1D" ? v : ["Start", "20%", "40%", "60%", "80%", "Now"][i]}</text>`).join("")}</svg>`;
}
function swapForm(compact = false) {
  return `<form id="swap-form"><div class="swap-field"><div class="swap-label"><label for="swap-amount">You pay</label><span>Demo balance: 1.00 BNB</span></div><div class="swap-input-row"><input id="swap-amount" inputmode="decimal" type="number" min="0.00001" step="any" max="1000000" placeholder="0.00" aria-label="BNB amount" required/><div class="swap-token"><span class="bnb-mini">◇</span>BNB</div></div><div class="swap-fiat"><span id="pay-usd">≈ $0.00</span><button type="button" data-action="max">MAX</button></div></div><div class="swap-direction">${icon("arrow-down")}</div><div class="swap-field"><div class="swap-label">You receive <span>Estimated</span></div><div class="swap-input-row"><output id="swap-receive">0.00</output><div class="swap-token">${token(assets[0], true)}AMBR</div></div><div class="swap-fiat">BNB Smart Chain <span class="demo-tag">DEMO</span></div></div><div class="swap-rate">1 AMBR ≈ 0.00000405 BNB ${icon("info")}</div><button class="button amber full" type="submit">Preview swap ${icon("arrow-right")}</button><p class="swap-disclaimer">${icon("shield-check")} Simulation only. No funds will move.</p></form>${compact ? "" : '<div class="note">Live swaps require a deployed token and a funded liquidity pool. This calculator uses illustrative prices.</div>'}`;
}
function marketTable() {
  let list = assets.filter(
    (a) =>
      (state.filter !== "Favorites" || state.favorites.has(a.symbol)) &&
      (state.filter !== "Trending" || a.change > 2) &&
      (a.name.toLowerCase().includes(state.query.toLowerCase()) ||
        a.symbol.toLowerCase().includes(state.query.toLowerCase())),
  );
  return `<div class="table-scroll"><table><thead><tr><th class="star-col"></th><th>Name</th><th>Price</th><th>24h change</th><th>24h volume</th><th>Last 7 days</th><th></th></tr></thead><tbody>${list.map((a) => `<tr><td><button class="favorite ${state.favorites.has(a.symbol) ? "saved" : ""}" data-favorite="${a.symbol}" aria-label="${state.favorites.has(a.symbol) ? "Remove" : "Add"} ${a.name} ${state.favorites.has(a.symbol) ? "from" : "to"} favorites" aria-pressed="${state.favorites.has(a.symbol)}">${icon("star")}</button></td><td><div class="asset-cell">${token(a)}<strong>${a.name}<small>${a.symbol}</small></strong>${a.symbol === "AMBR" ? '<span class="asset-tag">Our token</span>' : ""}</div></td><td class="price-cell">${money(a.price)}</td><td class="${a.change > 0 ? "positive-text" : "negative-text"}">${a.change > 0 ? "+" : ""}${a.change.toFixed(2)}%</td><td>$${a.volume}</td><td>${spark(a)}</td><td><button class="trade-button" data-asset="${a.symbol}">Explore ${icon("arrow-up-right")}</button></td></tr>`).join("") || '<tr><td colspan="7" class="empty-cell">No assets found. Try a different search or add a favorite.</td></tr>'}</tbody></table></div>`;
}
function renderPage() {
  const page = state.page;
  const content = $("#content");
  if (page === "overview") content.innerHTML = overview();
  else if (page === "markets")
    content.innerHTML = `${heading("A world of possibilities.", "Discover assets and keep your favorites close. All prices are illustrative.")}<section class="panel markets-panel"><div class="market-tools"><div class="tabs">${["All assets", "Trending", "Favorites"].map((v) => `<button data-filter="${v}" class="${state.filter === v ? "selected" : ""}">${v}</button>`).join("")}</div><label class="search-field">${icon("search")}<input id="asset-search" type="search" placeholder="Search assets" aria-label="Search assets" value="${esc(state.query)}"/></label></div><div id="market-table">${marketTable()}</div></section>`;
  else if (page === "swap")
    content.innerHTML = `${heading("A spark in every swap.", "Explore the AMBR swap experience.")}<section class="panel standalone-swap"><h3>Swap preview <span class="demo-tag">DEMO</span></h3>${swapForm()}</section>`;
  else if (page === "portfolio")
    content.innerHTML = `${heading("Your corner of the ecosystem.", "Connect your own wallet to get started.")}<section class="panel empty-state"><div class="empty-icon">${icon("wallet")}</div><h2>${state.wallet ? "Wallet connected" : "Your journey starts here"}</h2><p>${state.wallet ? `<code>${esc(state.wallet)}</code><br>No AMBR balance is shown until a verified token is configured.` : "Connect a BNB Smart Chain wallet to view your address.<br>Your keys and funds always stay with you."}</p><button class="button amber" data-action="wallet">${icon("wallet")}${state.wallet ? "Wallet details" : "Connect wallet"}</button></section>`;
  else if (page === "earn")
    content.innerHTML = `${heading("Grow together.", "The best things are built with a community.")}<section class="panel empty-state"><div class="empty-icon">${icon("sprout")}</div><span class="neutral-badge">ON THE ROADMAP</span><h2>A little patience. A lot of possibility.</h2><p>AMBER Earn is being explored. There are no active staking pools<br>or promised returns. Follow the project for future updates.</p><button class="button amber" data-action="community">Stay in the loop ${icon("arrow-up-right")}</button></section>`;
  else if (page === "tokenomics")
    content.innerHTML = `${heading("One billion sparks.", "Simple token design. Transparent controls. A shared starting point.")}<section class="tokenomics-grid"><article class="panel token-supply"><div class="large-donut"><div><small>FIXED TOTAL SUPPLY</small><strong>1 billion</strong><span>AMBR</span></div></div><h2>AMBER · AMBR</h2><p>BEP-20 compatible · BNB Smart Chain · 18 decimals</p></article><article class="panel details-panel"><h3>Token at a glance</h3>${[
      [
        "Network",
        "BSC " +
          (state.settings.network === "mainnet"
            ? "Mainnet"
            : "Testnet (planned)"),
      ],
      ["Total supply", "1,000,000,000 AMBR"],
      ["Initial allocation", "100% to the designated treasury"],
      ["Additional minting", "Not available"],
      ["Transfer tax", "0% in the contract"],
      ["Owner controls", "Pause / unpause; transfer ownership"],
      ["Contract", state.settings.contractAddress || "Not deployed"],
      [
        "Treasury / owner",
        state.settings.tokenOwner || "Awaiting owner wallet",
      ],
    ]
      .map(
        ([k, v]) =>
          `<div class="detail-row"><span>${k}</span><strong>${esc(v)}</strong></div>`,
      )
      .join(
        "",
      )}<div class="note">The owner can pause all token transfers. Website admin access does not grant wallet ownership. Allocation and liquidity plans must be published before launch.</div></article></section>`;
  else if (page === "whitepaper")
    content.innerHTML = `${heading("The idea behind the energy.", "AMBER project brief · Draft v1.0")}<article class="panel document"><span class="eyebrow">MEET AMBER</span><h2>A community, with a token at its heart.</h2><p>AMBER is a proposed meme token on BNB Smart Chain, built around participation and a recognizable shared identity. The symbol is AMBR. The project is in its pre-launch stage.</p><h3>01 / Token design</h3><p>The proposed fixed supply is 1 billion AMBR with 18 decimals. The entire supply is created once and sent to the designated treasury wallet. There is no additional mint function and no transfer tax in the contract.</p><h3>02 / Administration</h3><p>The on-chain owner can pause and resume all transfers and transfer ownership using a two-step acceptance process. The website administrator manages project information. These are separate roles. No administrator can withdraw funds from a connected visitor wallet.</p><h3>03 / Roadmap</h3><div class="roadmap"><div><span>01</span><strong>Lay the foundation</strong><p>Website, mobile web app, contract and test coverage.</p></div><div><span>02</span><strong>Test & verify</strong><p>Testnet deployment, independent review and public token details.</p></div><div><span>03</span><strong>Launch together</strong><p>Owner-approved mainnet deployment and a published liquidity plan.</p></div></div><h3>04 / Participation & risk</h3><p>AMBR has no guaranteed value, yield, listing, or profit. A meme token may lose all value. This website’s sample prices, charts and swap estimates are illustrative. No sale, deposit service, or live exchange is available here.</p><button class="button outline" data-action="print">${icon("download")} Save project brief as PDF</button></article>`;
  else if (page === "admin") {
    content.innerHTML = heading(
      "The control room.",
      "Manage the AMBER website and project information.",
    );
    loadAdmin();
  } else {
    state.page = "overview";
    content.innerHTML = overview();
  }
  refreshIcons();
}
async function api(path, options = {}) {
  const response = await fetch(`${base}api/${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The admin backend is unavailable on this host. Open the full server deployment.",
    );
  }
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
async function loadAdmin() {
  try {
    const result = await api("admin/session");
    state.session = result.authenticated;
    if (state.page !== "admin") return;
    $("#content").innerHTML =
      heading(
        "The control room.",
        "Manage the AMBER website and project information.",
      ) +
      (state.session
        ? `<section class="panel admin-panel"><div class="panel-heading"><h3>Project settings</h3><button class="button outline" data-action="logout">Sign out</button></div><form id="settings-form"><label>Community announcement<input name="announcement" maxlength="160" required value="${esc(state.settings.announcement)}"/></label><label>Community link (HTTPS)<input name="communityUrl" type="url" placeholder="https://..." value="${esc(state.settings.communityUrl)}"/></label><label>Contract address<input name="contractAddress" pattern="0x[a-fA-F0-9]{40}" placeholder="0x… (leave empty until deployed)" value="${esc(state.settings.contractAddress)}"/></label><label>Owner / treasury address<input name="tokenOwner" pattern="0x[a-fA-F0-9]{40}" placeholder="0x…" value="${esc(state.settings.tokenOwner)}"/></label><label>Network<select name="network"><option value="testnet" ${state.settings.network === "testnet" ? "selected" : ""}>BSC Testnet</option><option value="mainnet" ${state.settings.network === "mainnet" ? "selected" : ""}>BSC Mainnet</option></select></label><p class="form-help">Publish only addresses you have verified. Changing these fields does not deploy a token or transfer on-chain ownership.</p><button class="button amber" type="submit">${icon("save")}Save settings</button><p class="form-result" aria-live="polite"></p></form></section>`
        : `<section class="panel login-panel"><div class="empty-icon">${icon("lock-keyhole")}</div><h2>Welcome back.</h2><p>Sign in to manage your AMBER ecosystem.</p><form id="login-form"><label>Username<input name="username" autocomplete="username" required maxlength="64"/></label><label>Password<input name="password" type="password" autocomplete="current-password" required maxlength="256"/></label><button class="button dark full" type="submit">Sign in ${icon("arrow-right")}</button><p class="form-result" aria-live="polite"></p></form><p class="form-help">Access is restricted to the project administrator.</p></section>`);
    refreshIcons();
  } catch (err) {
    if (state.page === "admin")
      $("#content").innerHTML +=
        `<section class="panel empty-state"><div class="empty-icon">${icon("server")}</div><h2>Admin server required</h2><p>${esc(err.message)}</p></section>`;
    refreshIcons();
  }
}
async function connect() {
  if (state.wallet) {
    modal(
      `<div class="empty-icon">${icon("wallet")}</div><h2>Your connected wallet</h2><p class="wallet-address">${esc(state.wallet)}</p><p>Connecting does not approve spending or send a transaction.</p><button class="button outline full" data-action="disconnect">Disconnect from AMBER</button>`,
    );
    return;
  }
  if (!window.ethereum) {
    modal(
      `<div class="empty-icon">${icon("wallet")}</div><h2>Bring your own wallet.</h2><p>Open AMBER in a wallet’s browser or install a browser wallet that supports BNB Smart Chain.</p><a class="button amber full" href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">Get MetaMask ${icon("arrow-up-right")}</a><p class="form-help">Never share your recovery phrase. AMBER will never ask for it.</p>`,
    );
    return;
  }
  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    state.wallet = accounts[0] || null;
    shell();
    toast("Wallet connected. No spending permissions requested.");
  } catch {
    toast("Wallet connection was cancelled or unavailable.");
  }
}
function install() {
  if (deferredInstall) {
    deferredInstall.prompt();
    deferredInstall = null;
  } else
    modal(
      `<div class="empty-icon">${icon("smartphone")}</div><h2>AMBER, on the go.</h2><p>Install the AMBER web app for a full-screen mobile experience.</p><div class="install-steps"><strong>iPhone or iPad</strong><p>Open in Safari → Share → Add to Home Screen.</p><strong>Android</strong><p>Open in Chrome → Menu → Install app or Add to Home screen.</p><strong>Desktop</strong><p>Use the install icon in your browser’s address bar, when available.</p></div><p class="form-help">Installation requires HTTPS. Online access is needed for admin and wallet features.</p>`,
    );
}
document.addEventListener("click", async (e) => {
  const button = e.target.closest("button, a");
  if (!button) return;
  if (button.dataset.period) {
    state.period = button.dataset.period;
    $("#price-chart").innerHTML = chart();
    document
      .querySelectorAll("[data-period]")
      .forEach((b) => b.classList.toggle("selected", b === button));
  }
  if (button.dataset.filter) {
    state.filter = button.dataset.filter;
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) => b.classList.toggle("selected", b === button));
    $("#market-table").innerHTML = marketTable();
    refreshIcons();
  }
  if (button.dataset.favorite) {
    const symbol = button.dataset.favorite;
    state.favorites.has(symbol)
      ? state.favorites.delete(symbol)
      : state.favorites.add(symbol);
    try {
      localStorage.setItem(
        "amber-favorites",
        JSON.stringify([...state.favorites]),
      );
    } catch {
      toast("Favorites are available for this visit only.");
    }
    $("#market-table").innerHTML = marketTable();
    refreshIcons();
  }
  if (button.dataset.asset) {
    const a = assets.find((a) => a.symbol === button.dataset.asset);
    modal(
      `${token(a)}<h2>${a.name} <small>${a.symbol}</small></h2><p>Illustrative price: <strong>${money(a.price)}</strong></p><p>This asset is displayed for discovery. Live trading is not enabled on AMBER.</p>${a.symbol === "AMBR" ? '<a class="button amber full" href="#tokenomics" data-action="close">View AMBR tokenomics</a>' : ""}`,
    );
  }
  switch (button.dataset.action) {
    case "menu":
      $(".sidebar").classList.toggle("mobile-open");
      break;
    case "close-menu":
      $(".sidebar").classList.remove("mobile-open");
      break;
    case "close":
      $("#modal").close();
      break;
    case "wallet":
      await connect();
      break;
    case "disconnect":
      state.wallet = null;
      $("#modal").close();
      shell();
      break;
    case "install":
      install();
      break;
    case "buy":
      location.hash = "tokenomics";
      break;
    case "community":
      modal(
        `<div class="empty-icon">${icon("users")}</div><h2>A community starts with us.</h2><p>${esc(state.settings.announcement)}</p>${state.settings.communityUrl ? `<a class="button amber full" href="${esc(state.settings.communityUrl)}" target="_blank" rel="noopener noreferrer">Join the community ${icon("arrow-up-right")}</a>` : "<p>Our official community channel will be published here before launch. Stay close.</p>"}`,
      );
      break;
    case "notifications":
      modal(
        `<span class="eyebrow">LATEST FROM AMBER</span><h2>The spark is just beginning.</h2><p>${esc(state.settings.announcement)}</p><div class="note">Pre-launch · The token has not been announced as live. Check Tokenomics for published contract details.</div>`,
      );
      break;
    case "chart-info":
      toast(
        "Sample AMBR prices for the selected period. These are not live market quotes.",
      );
      break;
    case "max":
      $("#swap-amount").value = "1";
      updateSwap();
      break;
    case "risk":
      modal(
        "<h2>Know the risk.</h2><p>Meme tokens are speculative and can lose all value. AMBER does not promise profits, yield, or exchange listings.</p><p>Prices and swap estimates on this site are demonstrations. The contract owner can pause transfers. No deposits or live trades are accepted here.</p>",
      );
      break;
    case "print":
      window.print();
      break;
    case "logout":
      try {
        await api("admin/logout", { method: "POST" });
        state.session = false;
        renderPage();
      } catch (err) {
        toast(err.message);
      }
      break;
  }
});
function updateSwap() {
  const value = Number($("#swap-amount").value) || 0;
  $("#swap-receive").textContent = ((value * 612.35) / 0.00248).toLocaleString(
    "en-US",
    { maximumFractionDigits: 2 },
  );
  $("#pay-usd").textContent = `≈ ${money(value * 612.35)}`;
}
document.addEventListener("input", (e) => {
  if (e.target.id === "swap-amount") updateSwap();
  if (e.target.id === "asset-search") {
    state.query = e.target.value;
    $("#market-table").innerHTML = marketTable();
    refreshIcons();
  }
});
document.addEventListener("submit", async (e) => {
  if (!["swap-form", "login-form", "settings-form"].includes(e.target.id))
    return;
  e.preventDefault();
  const form = e.target;
  if (form.id === "swap-form") {
    const amount = Number($("#swap-amount").value);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
      toast("Enter an amount between 0 and 1,000,000 BNB.");
      return;
    }
    modal(
      `<span class="demo-tag">SIMULATION</span><h2>Your swap preview.</h2><div class="preview-amount">${amount.toLocaleString()} BNB ${icon("arrow-down")} ${esc($("#swap-receive").textContent)} AMBR</div><p>Using illustrative prices. No transaction was sent, no balance was changed, and this is not a live quote.</p><button class="button amber full" data-action="close">Got it</button>`,
    );
    return;
  }
  const submit = form.querySelector("[type=submit]");
  submit.disabled = true;
  try {
    const body = Object.fromEntries(new FormData(form));
    if (form.id === "login-form") {
      await api("admin/login", { method: "POST", body: JSON.stringify(body) });
      renderPage();
    } else {
      const result = await api("admin/settings", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      state.settings = result.settings;
      form.querySelector(".form-result").textContent = "Settings saved.";
      toast("Project settings updated.");
    }
  } catch (err) {
    form.querySelector(".form-result").textContent = err.message;
  } finally {
    submit.disabled = false;
  }
});
window.addEventListener("hashchange", () => {
  state.page = location.hash.slice(1) || "overview";
  $("#modal").close();
  shell();
  window.scrollTo(0, 0);
});
if (window.ethereum?.on) {
  window.ethereum.on("accountsChanged", (accounts) => {
    state.wallet = accounts[0] || null;
    shell();
  });
}
shell();
api("config")
  .then((data) => {
    state.settings = data.settings;
    if (["tokenomics", "admin"].includes(state.page)) renderPage();
  })
  .catch(() => {});
if ("serviceWorker" in navigator && import.meta.env.PROD)
  navigator.serviceWorker.register(`${base}sw.js`).catch(() => {});
