// toyota-card.js - a Home Assistant dashboard card for a Toyota, using the
// Toyota Connected Services integration (pytoyoda/ha_toyota, installed from HACS).
// Shows: last update, parked distance from home, photo, doors/boot/bonnet/windows/warnings,
// range + odometer, a fuel gauge, mpg / electric / hybrid scores, last service, and a
// top-down car with each door's state.
// The integration reports km and L/100 km. Choose metric or imperial display units.
// Usage:  type: custom:toyota-card
//         prefix: <your car's entity prefix>   (optional - the first Toyota found is used)
//         units: metric | imperial   (optional; defaults to imperial for backwards compatibility)

const VERSION = "1.0.2";
const KM_MI = 0.621371, L100_MPG = 282.481;
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const num = v => (v === undefined || v === null || v === "" || isNaN(+v)) ? null : +v;
const formatNumber = (value, locale, dp = 0) => value === null ? "–" : value.toLocaleString(locale, { maximumFractionDigits: dp, minimumFractionDigits: dp });
const since = iso => {
  const t = Date.parse(iso); if (isNaN(t)) return "–";
  const m = Math.round((Date.now() - t) / 60000);
  return m < 60 ? `${Math.max(m, 0)} min` : m < 2880 ? `${Math.round(m / 60)} hours` : `${Math.round(m / 1440)} days`;
};
const dist = (a, b, c, d) => {        // metres between two lat/lon points
  const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(x));
};

const CSS = `
:host { --fg:#ffffff; --muted:#b8b8b8; --red:#e0533d; --amber:#f4a72c; --green:#5aa54b; display:block; height:100%; }
ha-card { background:var(--car-card-bg,#000); border:1px solid #ffffff1a; border-radius:16px; box-shadow:none; padding:12px 16px 16px; color:var(--fg);
  font-family:Roboto,system-ui,-apple-system,sans-serif; container-type:inline-size;
  height:100%; box-sizing:border-box; display:flex; flex-direction:column; overflow-x:hidden; overflow-y:auto; }   /* fills a panel/full-page view; the photo takes the spare height */
.top { display:flex; justify-content:space-between; align-items:center; font-size:13px; color:var(--muted); }
.top .upd { display:flex; align-items:center; gap:8px; cursor:pointer; } .top .upd i { width:6px; height:6px; border-radius:50%; background:#666; }
.top .upd.busy i { background:var(--amber); animation:blink 1s infinite; } @keyframes blink { 50% { opacity:.2; } }
.top .park { text-transform:uppercase; letter-spacing:.06em; cursor:pointer; } .top .park.drive { color:var(--green); }
.hero { position:relative; display:flex; justify-content:center; align-items:center; margin:2px 0 6px; flex:1 1 0; min-height:140px; }
.hero::before { content:""; position:absolute; left:50%; top:58%; width:78%; height:70%; transform:translate(-50%,-50%);
  background:radial-gradient(ellipse at center, #ffffff2e 0%, #ffffff0d 45%, transparent 70%); }
.hero img { position:relative; max-width:88%; max-height:100%; width:auto; height:auto; object-fit:contain; filter:drop-shadow(0 10px 14px #000a) brightness(1.1); transform:translateY(6%) scale(1.35); }
.hero ha-icon { --mdc-icon-size:100px; color:#ffffff40; margin:24px 0; }
.mid { display:grid; grid-template-columns:auto auto 1fr; gap:18px; align-items:center; }
.list { font-size:14px; line-height:1.55; } .list b { font-weight:500; } .list .bad { color:var(--red); } .list .warn { color:var(--amber); }
.kv span { display:block; font-size:14px; color:#e8e8e8; } .kv b { display:block; font-size:24px; font-weight:400; margin-bottom:8px; }
.gauge { justify-self:end; width:min(170px,100%); }
.gauge svg { width:100%; height:auto; display:block; }
.hr { position:relative; text-align:center; margin:18px 0 14px; } .hr::before { content:""; position:absolute; left:0; right:0; top:50%; border-top:1px solid #ffffff55; }
.hr span { position:relative; background:#0b1a2e; border-radius:6px; padding:2px 16px; font-size:16px; color:#e8e8e8; }
.info { display:grid; grid-template-columns:minmax(0,1.3fr) minmax(0,1fr); gap:10px; align-items:center; }
.cells { display:grid; grid-template-columns:1fr 1fr; gap:14px 12px; }
.cells span { display:block; font-size:14px; color:#e8e8e8; } .cells b { display:block; font-size:22px; font-weight:400; }
.box { grid-column:1 / -1; border:1px solid #ffffff99; border-radius:12px; padding:4px 10px 12px; margin:8px 6px 0; text-align:center; min-width:0; }
.box legend { margin:0 auto; padding:0 8px; font-size:14px; color:#e8e8e8; }
.box b { display:block; font-size:20px; font-weight:400; line-height:1.4; }
.topdown { display:grid; grid-template-columns:auto 1fr auto; grid-template-rows:1fr 1fr; align-items:center; gap:4px; }
.topdown svg { grid-row:1 / 3; grid-column:2; width:100%; max-width:110px; height:auto; justify-self:center; }
.corner { text-align:center; } .corner b { display:block; font-size:20px; font-weight:400; } .corner span { font-size:12px; color:var(--muted); text-transform:uppercase; }
.corner.bad b { color:var(--red); }
/* wide screens (e.g. an iPad in landscape): bigger type */
@container (min-width:700px) {
  ha-card { padding:18px 28px 24px; } .top { font-size:16px; } .list { font-size:18px; } .kv span, .cells span, .box legend { font-size:17px; }
  .kv b { font-size:34px; } .cells b { font-size:30px; } .box b { font-size:26px; } .corner b { font-size:26px; } .corner span { font-size:14px; }
  .gauge { width:240px; } .mid { gap:40px; } .hr span { font-size:18px; } .topdown svg { max-width:120px; } .cells { gap:16px 16px; }
}
/* phones: stack it, and let the card scroll instead of squeezing */
@container (max-width:520px) { .mid { grid-template-columns:1fr 1fr; gap:12px; } .gauge { grid-column:1 / -1; justify-self:center; width:200px; }
  .info { grid-template-columns:1fr; } .topdown svg { max-width:90px; } .hero { flex:0 0 auto; } .hero img { transform:none; max-width:100%; } .top { gap:8px; } }
`;

class YarisCard extends HTMLElement {
  setConfig(c) { this._config = c || {}; }
  getCardSize() { return 9; }
  set hass(h) {
    this._hass = h;
    let p = this._config.prefix;
    if (!p) { const k = Object.keys(h.states).find(e => /^sensor\..+_fuel_range$/.test(e) && h.states[e.replace("_fuel_range", "_odometer")]); p = k && k.slice(7, -11); }
    this._p = p;
    // only redraw when something shown changes (plus once a minute for the "x hours" clock)
    const sig = p ? Object.keys(h.states).filter(e => e.includes(p)).map(e => e + h.states[e].last_updated).join() + Math.floor(Date.now() / 60000) : "none";
    if (sig === this._sig) return; this._sig = sig;
    this._render();
  }
  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const r = this.shadowRoot, h = this._hass, p = this._p;
    const units = this._config.units === "metric" ? "metric" : "imperial";
    const locale = h.locale?.language;
    const distance = (km, dp = 0) => formatNumber(km === null ? null : units === "metric" ? km : km * KM_MI, locale, dp);
    const distanceUnit = units === "metric" ? "km" : "mi";
    if (!p) { r.innerHTML = `<style>${CSS}</style><ha-card>No Toyota car found (pytoyoda/ha_toyota integration).</ha-card>`; return; }
    const S = s => h.states[`sensor.${p}_${s}`], B = s => h.states[`binary_sensor.${p}_${s}`]?.state;

    const fuel = num(S("fuel_level")?.state), range = num(S("fuel_range")?.state), odo = num(S("odometer")?.state);
    // binary sensors: door/window/hood/trunk on = open, lock on = unlocked
    const doors = { driverseat: "driver", passengerseat: "passenger", leftrearseat: "rear left", rightrearseat: "rear right" };
    const unlocked = [...Object.keys(doors), "trunk"].some(k => B(`${k}_lock`) === "on") || h.states[`lock.${p}_door_lock`]?.state === "unlocked";
    const winsOpen = Object.keys(doors).some(k => B(`${k}_window`) === "on");
    const driving = B("driving") === "on";
    const tr = h.states[`device_tracker.${p}_parking_location`], z = h.states["zone.home"]?.attributes, la = tr?.attributes?.latitude, lo = tr?.attributes?.longitude;
    const away = z && la ? dist(z.latitude, z.longitude, la, lo) : null;
    const awayKm = away === null ? null : away / 1000;
    const where = driving ? "driving" : away === null ? "parked" : away < 200 ? "parked · home" : `parked · ${distance(awayKm, 1)} ${distanceUnit}`;
    const yr = S("current_year_statistics")?.attributes || {}, yrKm = num(S("current_year_statistics")?.state);
    const averageConsumption = num(yr.Average_fuel_consumed);
    const consumption = averageConsumption === null ? null : units === "metric" ? averageConsumption : Math.round(L100_MPG / averageConsumption);
    const consumptionUnit = units === "metric" ? "L/100 km" : "UK mpg";
    const evPct = yrKm && num(yr.EV_distance) !== null ? Math.round(100 * yr.EV_distance / yrKm) : null;
    const trip = (S("recent_trips")?.attributes?.trips || [])[0];
    const svc = S("last_service"), svcOdo = num(svc?.attributes?.odometer);
    const warn = (num(S("warning_lights")?.state) || 0) > 0 || B("vehicle_health") === "on";
    const pic = tr?.attributes?.entity_picture;

    const st = (label, open, word = ["closed", "open"], cls = "bad") => `${label}: <b class="${open ? cls : ""}">${open ? word[1] : word[0]}</b><br>`;

    // fuel gauge: red / amber / green bands, white needle, big %
    const f = Math.max(0, Math.min(100, fuel ?? 0)), arc = (a0, a1, c) => {
      const P = a => [100 + 78 * Math.cos(Math.PI * (1 - a)), 100 - 78 * Math.sin(Math.PI * (1 - a))];
      const [x0, y0] = P(a0), [x1, y1] = P(a1);
      return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A78 78 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${c}" stroke-width="30"/>`; };
    const na = Math.PI * (1 - f / 100), nx = 100 + 92 * Math.cos(na), ny = 100 - 92 * Math.sin(na), nx0 = 100 + 58 * Math.cos(na), ny0 = 100 - 58 * Math.sin(na);
    const gauge = `<svg viewBox="0 0 200 112">${arc(0, .3, "var(--red)")}${arc(.3, .62, "var(--amber)")}${arc(.62, 1, "var(--green)")}
      <line x1="${nx0.toFixed(1)}" y1="${ny0.toFixed(1)}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <text x="100" y="108" text-anchor="middle" fill="#fff" font-size="44" font-weight="500">${fuel === null ? "–" : Math.round(fuel)}%</text></svg>`;

    // top-down car (front at the top); doors at the corners. UK cars are right-hand drive, so the driver's door is top right
    const corner = (k, lbl) => { const o = B(`${k}_door`) === "on"; return `<div class="corner ${o ? "bad" : ""}"><b>${o ? "Open" : "Shut"}</b><span>${lbl}</span></div>`; };
    const doorCol = k => B(`${k}_door`) === "on" ? "#e0533d" : "#2b2b2b";
    const car = `<svg viewBox="0 0 100 200">
      <defs><linearGradient id="yb" x1="0" x2="1"><stop offset="0" stop-color="#1a1a1a"/><stop offset=".5" stop-color="#3a3a3a"/><stop offset="1" stop-color="#1a1a1a"/></linearGradient></defs>
      <rect x="10" y="6" width="80" height="188" rx="30" fill="url(#yb)" stroke="#555" stroke-width="1"/>
      <path d="M22 18 Q50 8 78 18 L76 46 Q50 40 24 46 Z" fill="${B("hood") === "on" ? "#e0533d" : "#2a2a2a"}"/>
      <path d="M22 54 Q50 46 78 54 L72 82 Q50 77 28 82 Z" fill="#0d0d0d" stroke="#666" stroke-width=".6"/>
      <rect x="27" y="86" width="46" height="58" rx="8" fill="#151515"/>
      <text x="50" y="119" text-anchor="middle" fill="#fff" font-size="11">${unlocked ? "unlocked" : "locked"}</text>
      <path d="M28 150 Q50 154 72 150 L74 168 Q50 172 26 168 Z" fill="#0d0d0d" stroke="#666" stroke-width=".6"/>
      <path d="M24 174 Q50 178 76 174 L74 188 Q50 194 26 188 Z" fill="${B("trunk") === "on" ? "#e0533d" : "#2a2a2a"}"/>
      <rect x="6" y="58" width="5" height="40" rx="2" fill="${doorCol("passengerseat")}"/><rect x="89" y="58" width="5" height="40" rx="2" fill="${doorCol("driverseat")}"/>
      <rect x="6" y="102" width="5" height="40" rx="2" fill="${doorCol("leftrearseat")}"/><rect x="89" y="102" width="5" height="40" rx="2" fill="${doorCol("rightrearseat")}"/>
      <rect x="2" y="56" width="8" height="5" rx="2" fill="#333"/><rect x="90" y="56" width="8" height="5" rx="2" fill="#333"/></svg>`;

    r.innerHTML = `<style>${CSS}</style><ha-card>
      <div class="top"><span class="upd ${this._busy ? "busy" : ""}" title="Ask the car for an update"><i></i>${since(S("status_last_reported_by_car")?.state)}</span>
        <span class="park ${driving ? "drive" : ""}" title="Open in Google Maps">${esc(where)}</span></div>
      <div class="hero">${pic ? `<img src="${esc(pic)}" alt="">` : `<ha-icon icon="mdi:car-hatchback"></ha-icon>`}</div>
      <div class="mid">
        <div class="list">${st("doors", unlocked, ["locked", "unlocked"], "warn")}${st("boot", B("trunk") === "on")}${st("bonnet", B("hood") === "on")}
          ${st("windows", winsOpen)}${st("warnings", warn, ["none", "on"])}</div>
        <div class="kv"><span>estimated range</span><b>${distance(range)} ${distanceUnit}</b><span>odometer</span><b>${distance(odo)} ${distanceUnit}</b></div>
        <div class="gauge">${gauge}</div>
      </div>
      <div class="hr"><span>information</span></div>
      <div class="info">
        <div class="cells">
          <div><span>average ${consumptionUnit}</span><b>${consumption ?? "–"}</b></div><div><span>electric driving</span><b>${evPct ?? "–"}%</b></div>
          <div><span>hybrid score</span><b>${yr.Hybrid_score ? Math.round(yr.Hybrid_score) : "–"}</b></div><div><span>last trip score</span><b>${trip?.scores?.global ?? "–"}</b></div>
          <fieldset class="box"><legend>last service</legend><b>${svc?.state ? new Date(svc.state).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "–"}</b>
            <b>${svcOdo !== null && odo !== null ? `${distance(odo - svcOdo)} ${distanceUnit} ago` : ""}</b></fieldset>
        </div>
        <div class="topdown">${corner("passengerseat", "passenger")}${car}${corner("driverseat", "driver")}${corner("leftrearseat", "rear left")}${corner("rightrearseat", "rear right")}</div>
      </div>
    </ha-card>`;

    r.querySelector(".upd").addEventListener("click", () => {
      h.callService("button", "press", { entity_id: `button.${p}_refresh_vehicle_status` });
      this._busy = true; this._sig = null; this._render(); setTimeout(() => { this._busy = false; this._sig = null; this._render(); }, 60000);
    });
    if (la) r.querySelector(".park").addEventListener("click", () => window.open(`https://www.google.com/maps/search/?api=1&query=${la},${lo}`, "_blank"));
  }
}
// each name is only registered if it's free, so this file can load next to the older blog
// version (which also registers "yaris-card") without stopping with an error
if (!customElements.get("toyota-card")) customElements.define("toyota-card", YarisCard);
// older name from the blog version, so existing dashboards keep working
if (!customElements.get("yaris-card")) customElements.define("yaris-card", class extends YarisCard {});

window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === "toyota-card")) window.customCards.push({ type: "toyota-card", name: "Toyota Card", description: "Fuel, doors, locks, trips and service for a Toyota (ha_toyota integration)", preview: false });
console.info(`%c TOYOTA-CARD %c v${VERSION} `, "background:#eb0a1e;color:#fff;font-weight:700", "background:#222;color:#fff");
