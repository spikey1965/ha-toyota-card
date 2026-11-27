const fs = require("fs");
const reg = {}; const stub = () => ({ addEventListener() {}, set onclick(v) {}, style: {} });
globalThis.HTMLElement = class { attachShadow() { this.shadowRoot = { innerHTML: "", querySelector: stub, querySelectorAll: () => [] }; return this.shadowRoot; } };
globalThis.customElements = { define: (n, c) => { reg[n] = c; }, get: n => reg[n] };
globalThis.window = globalThis; window.customCards = []; window.open = () => {};
const file = process.argv[2]; eval(fs.readFileSync(file, "utf8"));
const st = (state, attrs = {}) => ({ state: String(state), attributes: attrs, last_updated: "x" });
function run(name, states, entities = {}, cfg = {}) {
  const C = customElements.get("toyota-card"), c = new C(); c.setConfig(cfg);
  let err = null; try { c.hass = { states, entities, locale: { language: "en" }, callService() {} }; } catch (e) { err = e.message; }
  const html = (c.shadowRoot && c.shadowRoot.innerHTML || "").replace(/<style>[\s\S]*?<\/style>/, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const odo = (html.match(/odometer\s+([\d,.–]+)/) || [])[1];
  console.log(`${name.padEnd(34)} p=${c._p} na=${c._na} sfx=${!!c._sfx} odometer=${odo || "-"} ${err ? "ERROR " + err : ""}${html.length < 400 ? "| " + html.trim().slice(0, 150) : ""}`);
}
const mi = { unit_of_measurement: "mi" };
// A: EU ha_toyota (user's Yaris style)
run("A EU ha_toyota", { "sensor.yaris_fuel_range": st(300, { unit_of_measurement: "km" }), "sensor.yaris_odometer": st(12000, { unit_of_measurement: "km" }), "sensor.yaris_fuel_level": st(60) }, { "sensor.yaris_odometer": { platform: "toyota" } });
// B: NA official naming
run("B NA official (odometer_<car>)", { "sensor.odometer_2024_rav4": st(5000, mi), "sensor.fuel_level_2024_rav4": st(70), "sensor.distance_to_empty_2024_rav4": st(320, mi), "lock.2024_rav4": st("locked") }, { "sensor.odometer_2024_rav4": { platform: "toyota_na", device_id: "d1" } });
// C: NA fork naming (<car>_odometer) with full sensors
const C = "2026_rav4_plug_in_hybrid";
run("C NA fork (<car>_odometer)", { [`sensor.${C}_odometer`]: st(166, mi), [`sensor.${C}_fuel_level`]: st(79), [`sensor.${C}_distance_to_empty`]: st(400, mi), [`sensor.${C}_ev_battery_level`]: st(87), [`lock.${C}`]: st("locked"), [`device_tracker.${C}_last_parked_location`]: st("home", { latitude: 1, longitude: 2 }) }, { [`sensor.${C}_odometer`]: { platform: "toyota_na", device_id: "d2" } });
// D: fork naming, only odometer + fuel, found via registry platform
run("D NA fork, odometer+fuel only", { [`sensor.${C}_odometer`]: st(166, mi), [`sensor.${C}_fuel_level`]: st(79) }, { [`sensor.${C}_odometer`]: { platform: "toyota_na" } });
// E: fork naming with explicit prefix
run("E NA fork, prefix set", { [`sensor.${C}_odometer`]: st(166, mi), [`sensor.${C}_distance_to_empty`]: st(400, mi) }, {}, { prefix: C });
// F: official v2.7.0 on a 2026 RAV4 (24MM): only lock + remote start
run("F 24MM on official (2 entities)", { [`lock.${C}`]: st("locked"), [`binary_sensor.remote_start_${C}`]: st("off") }, { [`lock.${C}`]: { platform: "toyota_na" }, [`binary_sensor.remote_start_${C}`]: { platform: "toyota_na" } });
