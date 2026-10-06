import type { MiniApp } from "@/data/miniApps";
import type { Palette } from "@/theme/colors";
import { glyphs } from "@/mini/glyphs";

// Stand-in pages for partner mini apps until they are served from their own URLs. They talk to
// MiniGo only through `window.mini`, exactly as a real mini app would.

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const svg = (name: string, size: number, stroke = 1.8) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[name] ?? ""}</svg>`;

// Demo merchant for the stand-in pages' testnet payments (a valid Stellar address, not a real business). If the
// testnet has no account for it (e.g. after a testnet reset), the first XLM payment creates it.
const DEMO_MERCHANT = "GBAW5XGWORWVFE2XTJYDTLDHXTY2Q2MO73HYCGB3XMFMQ562Q2W2GJQX";

type PaymentDemo = { amount: string; memo: string; payLabel: string; paidLabel: string };

// Shared script: the first tap asks MiniGo for wallet access, later taps ask for a testnet payment. Every
// answer, including a decline, is reflected in the page. `window.mini` follows SEP-43: calls resolve with
// `{ error }` instead of throwing (-4 means the user declined).
const walletScript = (payment: PaymentDemo) => `(function () {
  var buttons = document.querySelectorAll("[data-connect]");
  var statusLine = document.getElementById("status");
  var primary = document.getElementById("primary");
  var connected = false;
  var busy = false;
  function short(value) { return value.length > 14 ? value.slice(0, 6) + "…" + value.slice(-4) : value; }
  function failed(result) {
    var error = result && result.error;
    if (!error) return false;
    statusLine.textContent = error.code === -4 ? "Declined in MiniGo." : error.message || "Something went wrong.";
    return true;
  }
  function tap() {
    if (!window.mini) { statusLine.textContent = "Open this page inside MiniGo."; return; }
    if (busy) return;
    busy = true;
    statusLine.textContent = connected ? "Waiting for MiniGo…" : "";
    var request = connected
      ? window.mini.requestPayment({ to: ${JSON.stringify(DEMO_MERCHANT)}, amount: ${JSON.stringify(payment.amount)}, asset: "XLM", memo: ${JSON.stringify(payment.memo)} }).then(function (result) {
          if (failed(result)) return;
          primary.textContent = ${JSON.stringify(payment.paidLabel)};
          statusLine.textContent = "Paid on testnet · " + short(String(result.hash || ""));
        })
      : window.mini.requestAccess().then(function (result) {
          if (failed(result)) return;
          connected = true;
          document.body.classList.add("connected");
          primary.textContent = ${JSON.stringify(payment.payLabel)};
          statusLine.textContent = "Connected · " + short(String(result.address || ""));
        });
    request.then(function () { busy = false; });
  }
  buttons.forEach(function (button) { button.addEventListener("click", tap); });
})();`;

const baseStyles = `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,system-ui,sans-serif;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}
  button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
  input{font:inherit;color:inherit;background:transparent;border:0;outline:0;min-width:0;flex:1}
  #status{min-height:18px;text-align:center;font-size:12.5px}
`;

function healthConnectPage(colors: Palette) {
  const p = colors.partner;
  const categories = [
    { label: "General", icon: "stethoscope" },
    { label: "Heart", icon: "heart" },
    { label: "Pharmacy", icon: "pill" },
  ];
  const doctors = [
    { initials: "AB", name: "Dr. [Name]", detail: "General practice · video" },
    { initials: "KM", name: "Dr. [Name]", detail: "Cardiology · clinic" },
  ];

  return `
  <style>
    body{background:${p.bg};color:${p.ink}}
    main{min-height:100%;display:flex;flex-direction:column;padding:22px 18px 0}
    h1{font-size:24px;font-weight:600;letter-spacing:-.02em}
    .muted{color:${p.muted}}
    .sub{margin-top:4px;font-size:13px}
    .search{margin-top:16px;height:44px;border-radius:12px;background:${p.soft};display:flex;align-items:center;gap:10px;padding:0 14px;color:${p.muted}}
    .search input{font-size:14px;color:${p.ink}}
    .search input::placeholder{color:${p.muted}}
    .grid{margin-top:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .tile{height:84px;border-radius:16px;background:${p.soft};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font-size:12.5px;font-weight:500}
    .tile svg{color:${p.accent}}
    h2{margin-top:22px;font-size:15px;font-weight:600}
    ul{margin-top:10px;list-style:none;border:1px solid ${p.line};border-radius:16px;padding:0 14px}
    li{height:72px;display:flex;align-items:center;gap:12px}
    li+li{border-top:1px solid ${p.line}}
    .avatar{width:44px;height:44px;border-radius:50%;background:${p.soft};color:${p.accent};display:grid;place-items:center;font-size:14px;font-weight:600;flex-shrink:0}
    .who{flex:1;min-width:0}
    .who p:first-child{font-size:15px;font-weight:500}
    .who p:last-child{margin-top:1px;font-size:12.5px}
    .book{border-radius:999px;background:${p.soft};color:${p.accent};padding:7px 12px;font-size:12.5px;font-weight:600}
    footer{margin-top:auto;padding:24px 0 18px}
    #primary{width:100%;height:52px;border-radius:14px;background:${p.accent};color:${p.onAccent};font-size:15px;font-weight:600}
    #status{margin-top:10px;color:${p.muted}}
  </style>
  <main>
    <h1>Find care</h1>
    <p class="sub muted">Doctors and pharmacies near you</p>
    <label class="search">${svg("search", 16)}<input type="search" placeholder="Search symptoms or doctors" aria-label="Search symptoms or doctors"></label>
    <div class="grid">
      ${categories.map((item) => `<div class="tile">${svg(item.icon, 22)}<span>${item.label}</span></div>`).join("")}
    </div>
    <h2>Available now</h2>
    <ul>
      ${doctors
        .map(
          (doctor) => `<li><span class="avatar">${doctor.initials}</span><div class="who"><p>${doctor.name}</p><p class="muted">${doctor.detail}</p></div><button class="book" data-connect>Book</button></li>`,
        )
        .join("")}
    </ul>
    <footer>
      <button id="primary" data-connect>Consult a doctor</button>
      <p id="status" role="status"></p>
    </footer>
  </main>
  <script>${walletScript({ amount: "25", memo: "Video consultation", payLabel: "Pay 25 XLM · Video consultation", paidLabel: "Booked · see you soon" })}</script>`;
}

function genericPage(app: MiniApp, colors: Palette) {
  const name = escapeHtml(app.name);
  return `
  <style>
    body{background:${colors.frame};color:${colors.ink}}
    main{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 32px;text-align:center}
    .icon{width:72px;height:72px;border-radius:20px;background:${colors.soft};border:1px solid ${colors.line};display:grid;place-items:center}
    h1{margin-top:16px;font-size:18px;font-weight:600;letter-spacing:-.01em}
    .muted{color:${colors.muted}}
    .detail{margin-top:4px;font-size:13px}
    .note{margin-top:24px;max-width:260px;font-size:12.5px;line-height:1.6}
    .cta{margin-top:20px;height:44px;border-radius:999px;border:1px solid ${colors.line};padding:0 20px;display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600}
    .cta svg{display:block}
    .check{display:none}
    .connected .check{display:block}
    .connected .link{display:none}
    #status{margin-top:12px;color:${colors.muted}}
  </style>
  <main>
    <div class="icon">${svg(app.id, 32)}</div>
    <h1>${name}</h1>
    <p class="detail muted">${escapeHtml(app.detail)}</p>
    <p class="note muted">${escapeHtml(app.developer)}'s mini app runs in this frame. It can ask to use your MiniGo wallet, and you approve every request.</p>
    <button class="cta" data-connect><span class="link">${svg("link", 16, 1.9)}</span><span class="check">${svg("check", 16, 2)}</span><span id="primary">Try a wallet request</span></button>
    <p id="status" role="status"></p>
  </main>
  <script>
    ${walletScript({ amount: "1", memo: `${app.name} test`.slice(0, 28), payLabel: "Try a 1 XLM payment", paidLabel: "Paid 1 XLM · try again" })}
  </script>`;
}

export function buildMiniAppPage(app: MiniApp, colors: Palette) {
  const body = app.id === "healthconnect" ? healthConnectPage(colors) : genericPage(app, colors);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<title>${escapeHtml(app.name)}</title>
<style>${baseStyles}</style>
</head>
<body>${body}</body>
</html>`;
}
