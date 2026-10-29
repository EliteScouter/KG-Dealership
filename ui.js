// ============================================================
//  Dealer Wars: the screen. Draws the lot, runs the business day
//  (customers walking up to cars), and the side panel tabs.
//  On Kaotic Gaming it saves to the player's account through
//  window.KG; opened on its own it saves in this browser.
// ============================================================
(function () {
  'use strict';
  const DW = window.DW, U = DW.util, fmt = DW.fmt;
  const KG = () => window.KG;
  const LS_KEY = 'dealer-wars-save-v1';
  let S = null;
  const ui = { tab: 'lot', buyTab: 'auction', sel: null, running: false, speed: 1, dirty: false };
  const $ = id => document.getElementById(id);
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms / ui.speed));
  const $m = v => `$${fmt(v)}`;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // ---------- saving ----------
  function loadSave() {
    if (KG()) return KG().initialSave ? DW.ready(clone(KG().initialSave)) : null;
    try { return DW.ready(JSON.parse(localStorage.getItem(LS_KEY))); } catch (e) { return null; }
  }
  const clone = o => JSON.parse(JSON.stringify(o));
  let saveTimer = null;
  function save(now) {
    clearTimeout(saveTimer);
    const run = () => {
      if (!S) return;
      if (KG()) {
        KG().save(S);
        KG().report({ earned: S.earned, carsSold: S.carsSold, netWorth: DW.netWorth(S), day: S.day, rep: Math.round(S.rep), dealership: S.name });
        KG().setStatus(`Day ${S.day} · ${S.cars.length} cars on the lot`);
      } else { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {} }
      showSaveState();
    };
    if (now) run(); else saveTimer = setTimeout(run, 600);
  }
  function showSaveState() {
    const el = $('saveState');
    if (!KG()) { el.textContent = 'Saved in this browser'; return; }
    const st = KG().saveState;
    el.textContent = { saved: 'Saved to your account', saving: 'Saving…', error: 'Save failed, retrying', 'signed-out': 'Signed out! Sign in to save' }[st] || '';
    el.classList.toggle('err', st === 'error' || st === 'signed-out');
  }
  setInterval(() => { if (KG()) showSaveState(); }, 2000);

  // ---------- drawing cars (top-down, nose pointing down) ----------
  const DIMS = { sedan: [44, 76], hatch: [42, 66], wagon: [44, 80], coupe: [44, 72], roadster: [42, 66], suv: [48, 80], truck: [50, 92], van: [50, 86], muscle: [46, 82], classic: [48, 86], exotic: [52, 74] };
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const ch = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }
  const seeded = (id, k) => { const x = Math.sin(id * 99.13 + k * 17.7) * 43758.5453; return x - Math.floor(x); };
  function carShape(car) {
    const m = DW.model(car), body = m.body, [w, l] = DIMS[body] || DIMS.sedan;
    const col = DW.COLORS[car.color][1], dark = shade(col, 0.62), light = shade(col, 1.18);
    const glass = '#24313f', hw = w / 2, hl = l / 2;
    let s = '';
    // wheels
    for (const [x, y] of [[-hw - 1, hl * 0.55], [hw - 7, hl * 0.55], [-hw - 1, -hl * 0.6], [hw - 7, -hl * 0.6]]) s += `<rect x="${x}" y="${y - 8}" width="8" height="16" rx="2" fill="#101114"/>`;
    const r = body === 'exotic' ? 18 : body === 'van' || body === 'truck' ? 7 : 11;
    s += `<rect x="${-hw}" y="${-hl}" width="${w}" height="${l}" rx="${r}" fill="${col}" stroke="${dark}" stroke-width="2"/>`;
    if (body === 'truck') {
      s += `<rect x="${-hw + 5}" y="${-hl + 5}" width="${w - 10}" height="${l * 0.42}" rx="3" fill="${dark}"/>`;
      s += `<rect x="${-hw + 7}" y="${-hl + 8}" width="${w - 14}" height="${l * 0.42 - 6}" fill="#3a3326" opacity=".55"/>`;
      s += `<path d="M${-hw + 6},${-l * 0.02} L${hw - 6},${-l * 0.02} L${hw - 9},${l * 0.12} L${-hw + 9},${l * 0.12}Z" fill="${glass}"/>`;
      s += `<rect x="${-hw + 7}" y="${-l * 0.05}" width="${w - 14}" height="4" fill="${glass}"/>`;
    } else if (body === 'van') {
      s += `<rect x="${-hw + 5}" y="${-hl + 6}" width="${w - 10}" height="${l * 0.68}" rx="4" fill="${light}"/>`;
      s += `<path d="M${-hw + 5},${l * 0.2} L${hw - 5},${l * 0.2} L${hw - 8},${l * 0.34} L${-hw + 8},${l * 0.34}Z" fill="${glass}"/>`;
      s += `<rect x="${-hw + 5}" y="${-hl + 4}" width="${w - 10}" height="5" fill="${glass}"/>`;
    } else if (body === 'roadster') {
      s += `<path d="M${-hw + 7},${l * 0.02} L${hw - 7},${l * 0.02} L${hw - 9},${l * 0.1} L${-hw + 9},${l * 0.1}Z" fill="${glass}" opacity=".9"/>`;
      s += `<rect x="${-hw + 7}" y="${-l * 0.2}" width="${hw - 9}" height="${l * 0.2}" rx="5" fill="#2a2016"/><rect x="2" y="${-l * 0.2}" width="${hw - 9}" height="${l * 0.2}" rx="5" fill="#2a2016"/>`;
    } else {
      const ws = body === 'exotic' ? 0.0 : 0.08, we = body === 'exotic' ? 0.16 : 0.22;
      const roofTop = body === 'wagon' || body === 'suv' ? -0.4 : body === 'hatch' ? -0.36 : -0.28;
      s += `<path d="M${-hw + 5},${l * ws} L${hw - 5},${l * ws} L${hw - 8},${-l * 0.02 + l * we} L${-hw + 8},${-l * 0.02 + l * we}Z" transform="translate(0,${-l * 0.02})" fill="${glass}"/>`;
      s += `<rect x="${-hw + 6}" y="${l * roofTop}" width="${w - 12}" height="${l * (ws - roofTop) - 2}" rx="5" fill="${light}"/>`;
      s += `<path d="M${-hw + 7},${l * roofTop} L${hw - 7},${l * roofTop} L${hw - 9},${l * roofTop - l * 0.09} L${-hw + 9},${l * roofTop - l * 0.09}Z" fill="${glass}"/>`;
      if (body === 'muscle' || (body === 'coupe' && car.id % 3 === 0)) s += `<rect x="-7" y="${-hl + 2}" width="4" height="${l - 4}" fill="#f4f4f4" opacity=".85"/><rect x="3" y="${-hl + 2}" width="4" height="${l - 4}" fill="#f4f4f4" opacity=".85"/>`;
      if (body === 'classic' || body === 'muscle') s += `<rect x="${-hw + 3}" y="${hl - 4}" width="${w - 6}" height="4" rx="2" fill="#d8dde3"/><rect x="${-hw + 3}" y="${-hl}" width="${w - 6}" height="4" rx="2" fill="#d8dde3"/>`;
    }
    // lights
    s += `<rect x="${-hw + 4}" y="${hl - 5}" width="9" height="4" rx="2" fill="#fff3b8"/><rect x="${hw - 13}" y="${hl - 5}" width="9" height="4" rx="2" fill="#fff3b8"/>`;
    s += `<rect x="${-hw + 4}" y="${-hl + 1}" width="8" height="3" rx="1" fill="#d43a2f"/><rect x="${hw - 12}" y="${-hl + 1}" width="8" height="3" rx="1" fill="#d43a2f"/>`;
    // condition you can see: rust, dents, dirt, shine
    if (car.body < 50) for (let i = 0; i < (car.body < 30 ? 5 : 3); i++) s += `<circle cx="${(seeded(car.id, i) - 0.5) * (w - 10)}" cy="${(seeded(car.id, i + 9) - 0.5) * (l - 14)}" r="${2.5 + seeded(car.id, i + 3) * 3.5}" fill="#8a4b1f" opacity=".85"/>`;
    if (car.detail < 40) for (let i = 0; i < 7; i++) s += `<circle cx="${(seeded(car.id, i + 20) - 0.5) * w}" cy="${(seeded(car.id, i + 30) - 0.5) * l}" r="${3 + seeded(car.id, i + 40) * 5}" fill="#6b5a3e" opacity=".33"/>`;
    if (car.detail > 85 && car.body > 75) s += `<path class="sparkle" d="M${hw - 8},${-hl + 10} l2,6 l6,2 l-6,2 l-2,6 l-2,-6 l-6,-2 l6,-2z" fill="#fff"/>`;
    return { svg: s, w, l };
  }
  function carIcon(car, size = 54) {
    const c = carShape(car);
    return `<svg viewBox="${-c.w / 2 - 6} ${-c.l / 2 - 4} ${c.w + 12} ${c.l + 8}" width="${size}" height="${size * 1.3}" aria-hidden="true">${c.svg}</svg>`;
  }

  // ---------- the scene ----------
  // the parking spaces fill the lot: a few big ones on the gravel lot, more and smaller as it grows
  const LOT_X = 40, LOT_Y = 200, LOT_W = 880, LOT_H = 330;
  const GRID = { 6: [3, 2], 10: [5, 2], 16: [8, 2], 24: [8, 3], 32: [8, 4] };
  function grid() { const [cols, rows] = GRID[DW.spaces(S)] || [8, Math.ceil(DW.spaces(S) / 8)]; return { cols, rows, cw: LOT_W / cols, ch: LOT_H / rows }; }
  const spotXY = i => { const g = grid(); return { x: LOT_X + (i % g.cols) * g.cw + g.cw / 2, y: LOT_Y + Math.floor(i / g.cols) * g.ch + g.ch / 2, cw: g.cw, ch: g.ch }; };
  function ensureSpots() {
    const max = DW.spaces(S), used = new Set();
    for (const c of S.cars) { if (c.spot == null || c.spot >= max || used.has(c.spot)) c.spot = null; else used.add(c.spot); }
    for (const c of S.cars) if (c.spot == null) { let i = 0; while (used.has(i)) i++; c.spot = i; used.add(i); }
  }
  function buildingsSvg() {
    const lv = S.levels, name = esc(S.name.toUpperCase());
    let s = '';
    // the office/showroom
    if (lv.showroom === 0) {
      s += `<rect x="40" y="88" width="190" height="78" rx="6" fill="#e9e4d6" stroke="#9e9682" stroke-width="2"/><rect x="40" y="88" width="190" height="10" fill="#b8b09a"/>
            <rect x="60" y="112" width="44" height="26" fill="#9cc6e8" stroke="#6d7c88"/><rect x="160" y="110" width="30" height="56" fill="#8a6a45"/><text x="135" y="183" text-anchor="middle" font-size="12" fill="#e6e6e6" font-weight="700">OFFICE</text>`;
    } else {
      const W = [0, 270, 330, 420][lv.showroom], H = [0, 110, 130, 150][lv.showroom];
      const y = 176 - H;
      s += `<rect x="36" y="${y}" width="${W}" height="${H}" rx="8" fill="${lv.showroom === 3 ? '#e8e8ea' : '#dcdfe3'}" stroke="#8f959e" stroke-width="2"/>`;
      const panes = lv.showroom + 3;
      for (let i = 0; i < panes; i++) s += `<rect x="${50 + i * (W - 28) / panes}" y="${y + 26}" width="${(W - 28) / panes - 6}" height="${H - 36}" fill="${lv.showroom >= 2 ? '#7fc4f0' : '#a9d3ee'}" opacity=".9"/><path d="M${54 + i * (W - 28) / panes},${y + 30} l14,0 l-10,30 l-14,0z" fill="#fff" opacity=".25"/>`;
      s += `<rect x="36" y="${y}" width="${W}" height="20" rx="8" fill="${lv.showroom === 3 ? '#1b1d22' : '#2a5ea8'}"/><text x="${36 + W / 2}" y="${y + 15}" text-anchor="middle" font-family="Bungee" font-size="13" fill="#ffcc33">${name}</text>`;
      if (lv.showroom === 3) for (const x of [44, 36 + W - 14]) s += `<rect x="${x}" y="${y + 20}" width="10" height="${H - 20}" fill="#c9ccd2"/>`;
    }
    if (lv.finance) s += `<rect x="40" y="62" width="150" height="20" rx="4" fill="#173a28"/><text x="115" y="76" text-anchor="middle" font-size="11" font-weight="800" fill="#a8f0c6">FINANCING AVAILABLE</text>`;
    // the big pole sign
    s += `<rect x="541" y="70" width="8" height="110" fill="#6b6f77"/><rect x="465" y="14" width="160" height="62" rx="8" fill="#c62828" stroke="#ffcc33" stroke-width="3"/>
          <text x="545" y="40" text-anchor="middle" font-family="Bungee" font-size="${S.name.length > 14 ? 11 : 15}" fill="#fff">${name}</text>
          <text x="545" y="62" text-anchor="middle" font-size="11" font-weight="800" fill="#ffcc33" letter-spacing="2">QUALITY USED CARS</text>`;
    // detail bay
    if (lv.detail) s += `<rect x="636" y="110" width="74" height="66" rx="5" fill="#d9eef7" stroke="#7aa7bd" stroke-width="2"/><rect x="644" y="132" width="58" height="44" fill="#5d7f90"/>
          <text x="673" y="126" text-anchor="middle" font-size="11" font-weight="800" fill="#2a5d75">DETAIL</text>${[0, 1, 2].map(i => `<circle cx="${655 + i * 17}" cy="${150 + (i % 2) * 8}" r="${5 + i}" fill="#fff" opacity=".7"/>`).join('')}`;
    // shop
    if (lv.shop) {
      const doors = Math.min(4, DW.level(S, 'shop').bays);
      s += `<rect x="720" y="96" width="200" height="80" rx="5" fill="#b9b2a3" stroke="#7d7768" stroke-width="2"/><rect x="720" y="96" width="200" height="16" fill="#4a4f57"/>
            <text x="820" y="108" text-anchor="middle" font-size="11" font-weight="800" fill="#ffcc33" letter-spacing="2">${['', 'GARAGE', 'SERVICE CENTER', 'RESTORATION'][lv.shop]}</text>`;
      for (let i = 0; i < doors; i++) { const dw = 180 / doors; s += `<rect x="${730 + i * dw}" y="120" width="${dw - 10}" height="56" fill="#6f747c"/>${[0, 1, 2, 3, 4].map(k => `<rect x="${730 + i * dw}" y="${124 + k * 10}" width="${dw - 10}" height="2" fill="#5a5e65"/>`).join('')}`; }
    }
    // billboard
    if (lv.billboard) s += `<rect x="745" y="18" width="170" height="64" rx="4" fill="${lv.billboard === 2 ? '#101418' : '#f4efe1'}" stroke="#555" stroke-width="2"/><rect x="826" y="82" width="8" height="12" fill="#555"/>
          <text x="830" y="48" text-anchor="middle" font-family="Bungee" font-size="14" fill="${lv.billboard === 2 ? '#4cd38a' : '#c62828'}">${name.slice(0, 16)}</text>
          <text x="830" y="68" text-anchor="middle" font-size="11" font-weight="800" fill="${lv.billboard === 2 ? '#ffcc33' : '#333'}">EXIT NOW! DEALS!</text>`;
    // bunting across the lot
    let flags = '';
    for (let i = 0; i < 30; i++) { const x = 40 + i * 30; flags += `<path d="M${x},188 l15,0 l-7.5,13z" fill="${['#ff5a36', '#ffcc33', '#4aa8ff', '#4cd38a'][i % 4]}"/>`; }
    s += `<path d="M40,188 L940,188" stroke="#ddd" stroke-width="1.5"/>${flags}`;
    // wacky inflatable tube men while an ad campaign runs
    if (S.ads.length) for (const [x, c, b] of [[22, '#ff5a36', ''], [938, '#4aa8ff', ' b']]) s += `<g transform="translate(${x},545)"><g class="tube-man${b}"><rect x="-7" y="-78" width="14" height="78" rx="7" fill="${c}"/><circle cx="0" cy="-82" r="8" fill="${c}"/><circle cx="-3" cy="-84" r="1.6" fill="#000"/><circle cx="3" cy="-84" r="1.6" fill="#000"/><path d="M-6,-62 l-16,-14 M6,-62 l18,-10" stroke="${c}" stroke-width="7" stroke-linecap="round"/></g></g>`;
    return s;
  }
  function drawScene() {
    let s = `<rect width="960" height="620" fill="#3f8a4a"/><rect y="0" width="960" height="190" fill="#4c9a56"/>`;
    s += `<rect x="${LOT_X - 10}" y="${LOT_Y - 8}" width="${LOT_W + 20}" height="${LOT_H + 14}" rx="10" fill="${S.levels.lot === 0 ? '#8a8578' : '#3a3d43'}"/>`;
    if (S.levels.lot === 0) for (let i = 0; i < 260; i++) s += `<circle cx="${LOT_X + (i * 137.5) % LOT_W}" cy="${LOT_Y + (i * 71.3) % LOT_H}" r="${1 + (i % 3)}" fill="${i % 2 ? '#a29c8d' : '#6f6a5f'}"/>`;
    s += `<rect x="0" y="538" width="960" height="18" fill="#b4b0a6"/><rect x="0" y="556" width="960" height="64" fill="#2a2c30"/>`;
    for (let x = 10; x < 960; x += 60) s += `<rect x="${x}" y="586" width="32" height="4" fill="#e8c33a"/>`;
    s += `<g id="buildings">${buildingsSvg()}</g><g id="lotLayer"></g><g id="peopleLayer"></g><g id="fxLayer"></g>`;
    $('scene').innerHTML = s;
    drawLot();
  }
  function drawLot() {
    ensureSpots();
    const max = DW.spaces(S), g = grid();
    let s = '';
    // painted lines between the spaces
    for (let i = 0; i < max; i++) {
      const { x, y } = spotXY(i);
      s += `<path d="M${x - g.cw / 2},${y - g.ch / 2 + 6} V${y + g.ch / 2 - 6}${i % g.cols === g.cols - 1 ? ` M${x + g.cw / 2},${y - g.ch / 2 + 6} V${y + g.ch / 2 - 6}` : ''}" stroke="${S.levels.lot === 0 ? '#5e5a52' : '#e9e9e9'}" stroke-width="2.5" opacity=".7" ${S.levels.lot === 0 ? 'stroke-dasharray="6 6"' : ''}/>`;
    }
    const taken = new Map(S.cars.map(c => [c.spot, c]));
    const k0 = Math.min(g.ch * 0.6, g.cw * 1.0) / 76; // car size for this lot
    const tagW = Math.min(g.cw * 0.78, 120), tagH = Math.max(16, Math.min(24, g.ch * 0.2)), fs = Math.round(tagH * 0.62);
    for (let i = 0; i < max; i++) {
      const { x, y } = spotXY(i), car = taken.get(i);
      if (!car) { s += `<g class="space" data-empty="${i}"><rect x="${x - g.cw / 2 + 6}" y="${y - g.ch / 2 + 6}" width="${g.cw - 12}" height="${g.ch - 12}" rx="10" fill="#fff" class="space-hl"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="${Math.round(fs * 1.1)}" font-weight="800" fill="${S.levels.lot === 0 ? '#5e5a52' : '#9aa0aa'}">+ BUY A CAR</text></g>`; continue; }
      const c = carShape(car), k = Math.min(k0, (g.ch * 0.62) / c.l);
      const ratio = car.ask / Math.max(1, DW.shownValue(S, car));
      const tagCol = car.job ? '#4a4f57' : ratio <= 0.97 ? '#1f7a46' : ratio <= 1.06 ? '#22598f' : ratio <= 1.16 ? '#9a6b0f' : '#a3262a';
      const sel = ui.sel === car.id, ty = y + g.ch / 2 - tagH - 6, m = DW.model(car);
      s += `<g class="car-g${sel ? ' sel' : ''}${car.job ? ' busy' : ''}" data-car="${car.id}">
        <rect x="${x - g.cw / 2 + 4}" y="${y - g.ch / 2 + 4}" width="${g.cw - 8}" height="${g.ch - 8}" fill="transparent"/>
        <rect class="sel-ring" x="${x - g.cw / 2 + 4}" y="${y - g.ch / 2 + 4}" width="${g.cw - 8}" height="${g.ch - 8}" rx="10" fill="none" stroke="#ffcc33" stroke-width="3"/>
        <g transform="translate(${x},${y - tagH / 2 - 2}) scale(${k})">${c.svg}</g>
        <rect x="${x - tagW / 2}" y="${ty}" width="${tagW}" height="${tagH}" rx="5" fill="${tagCol}" stroke="#fff" stroke-width="1"/>
        <text class="tag-text" x="${x}" y="${ty + tagH * 0.72}" text-anchor="middle" fill="#fff" font-size="${fs}">${car.job ? '\u{1F527} IN SHOP' : $m(car.ask)}</text>
        ${m.rarity >= 3 ? `<text x="${x + g.cw / 2 - 16}" y="${y - g.ch / 2 + 24}" text-anchor="middle" font-size="${Math.round(fs * 1.3)}">${['', '', '', '\u2B50', '\u{1F451}', '\u{1F48E}'][m.rarity]}</text>` : ''}
        ${car.award || wantedBy(car).length ? `<text x="${x - g.cw / 2 + 16}" y="${y - g.ch / 2 + 24}" text-anchor="middle" font-size="${Math.round(fs * 1.3)}">${wantedBy(car).length ? '\u2757' : '\u{1F3C6}'}</text>` : ''}
      </g>`;
    }
    $('lotLayer').innerHTML = s;
  }

  // ---------- top bar ----------
  function renderHud() {
    $('dealerName').textContent = S.name;
    $('autoDeals').checked = !!S.autoDeals;
    $('sCash').textContent = $m(S.cash);
    $('sCash').style.color = S.cash < 0 ? 'var(--bad)' : '';
    const debt = S.bank + S.shark;
    $('sDebt').textContent = $m(debt);
    $('debtStat').style.opacity = debt ? 1 : 0.45;
    $('sNet').textContent = $m(DW.netWorth(S));
    $('sRep').style.width = `${S.rep}%`;
    $('sRepN').textContent = Math.round(S.rep);
    $('sTier').textContent = DW.tier(S).name;
    $('sLot').textContent = `${S.cars.length}/${DW.spaces(S)}`;
    $('dayLabel').textContent = `Day ${S.day} · ${DAYS[(S.day - 1) % 7]}`;
    const bits = [];
    if (DW.vipOpen(S) && DW.isVipDay(S)) bits.push('\u{1F48E} VIP Invitational today!');
    if (S.auction && S.auction.collector) bits.push('\u{1F451} Collector auction today!');
    if (S.requests.length) bits.push(`\u2B50 ${S.requests.length} client request${S.requests.length > 1 ? 's' : ''} open`);
    if (S.concours) bits.push(`\u{1F3C6} Concours on day ${S.concours.day}`);
    if (S.shark) bits.push(`\u{1F4B0} Big Tony wants ${$m(S.shark)} by day ${S.sharkDue}`);
    if (!bits.length) bits.push(`~${DW.traffic(S).toFixed(1)} customers expected · ${S.staff.length} salesm${S.staff.length > 1 ? 'en' : 'an'} can help ${S.staff.length * DW.PER_SALESMAN}`);
    $('daySub').textContent = bits.join('  ·  ');
    $('openBtn').disabled = ui.running;
  }

  // ---------- panel ----------
  function render() { renderHud(); drawLot(); renderPanel(); }
  function renderPanel() {
    for (const b of $('tabs').children) b.setAttribute('aria-selected', String(b.dataset.tab === ui.tab));
    const body = $('tabBody');
    const top = body.scrollTop;
    body.innerHTML = { lot: renderLotTab, buy: renderBuyTab, upgrades: renderUpgradesTab, staff: renderStaffTab, empire: renderEmpireTab, bank: renderBankTab, news: renderNewsTab }[ui.tab]();
    body.scrollTop = top;
  }
  const grade = v => (v >= 85 ? 'A' : v >= 70 ? 'B' : v >= 55 ? 'C' : v >= 40 ? 'D' : 'F');
  const barColor = v => (v >= 75 ? '#4cd38a' : v >= 50 ? '#ffcc33' : v >= 30 ? '#ff9a3c' : '#ff6b6b');
  function bars(car, hideMech) {
    const mech = DW.apparentMech(car);
    const row = (label, v, note) => `<div class="bar"><span>${label}</span><span class="track"><i style="width:${v}%;background:${barColor(v)}"></i></span><b>${Math.round(v)}${note || ''}</b></div>`;
    return `<div class="bars">${row('Mechanical', mech, car.inspected || hideMech === false ? '' : '?')}${row('Body', car.body)}${row('Detail', car.detail)}</div>`;
  }
  function rarityBadge(m) { return `<span class="badge r${m.rarity}">${m.rarity === 5 ? '\u{1F48E} ' : ''}${DW.RARITY[m.rarity]}</span>`; }
  const wantedBy = car => S.requests.filter(r => r.mid === car.mid);
  function verdict(car) {
    const r = car.ask / Math.max(1, DW.shownValue(S, car));
    if (r <= 0.97) return ['v-bargain', 'Bargain: it’ll fly off the lot (maybe too cheap?)'];
    if (r <= 1.06) return ['v-fair', 'Fair price: most buyers will bite'];
    if (r <= 1.16) return ['v-pricey', 'A bit pricey: expect people to haggle'];
    return ['v-over', 'Overpriced: buyers will walk away'];
  }
  function renderLotTab() {
    ensureSpots();
    const car = S.cars.find(c => c.id === ui.sel);
    let h = '';
    if (car) h += carDetail(car);
    else h += `<h2>Your lot</h2><p class="muted small">Tap a car on the lot to price it, fix it up or wholesale it. Tap an empty space (or the Buy cars tab) to buy more.</p>` + bulkCard();
    h += `<h3>Inventory (${S.cars.length}/${DW.spaces(S)})</h3>`;
    if (!S.cars.length) h += `<p class="muted">Your lot is empty. Hit the <b>Buy cars</b> tab!</p>`;
    h += `<div class="inv-list">${S.cars.slice().sort((a, b) => a.spot - b.spot).map(c => {
      const profit = c.ask - c.cost;
      return `<button type="button" class="inv-item${c.id === ui.sel ? ' sel' : ''}" data-act="select" data-id="${c.id}">
        <span><b>${esc(DW.carName(c))}</b> ${DW.model(c).rarity >= 3 ? rarityBadge(DW.model(c)) : ''}</span><span class="money">${c.job ? '\u{1F527} shop' : $m(c.ask)}</span>
        <span class="muted small">${fmt(c.miles)} mi · ${grade(DW.condition(c, true))} condition · ${S.day - c.bought}d on lot</span><span class="small ${profit >= 0 ? 'pos' : 'neg'}">${profit >= 0 ? '+' : '-'}${$m(Math.abs(profit))}</span></button>`;
    }).join('')}</div>`;
    return h;
  }
  // bulk actions for the whole lot
  function bulkSummary(what) {
    const plan = DW.bulkPlan(S, what);
    return { n: new Set(plan.map(p => p.car.id)).size, jobs: plan.length, cost: plan.reduce((t, p) => t + p.cost, 0), gain: plan.reduce((t, p) => t + p.gain, 0) };
  }
  function bulkCard() {
    if (!S.cars.length) return '';
    const b = (what, label) => { const x = bulkSummary(what); return `<button class="btn" data-act="bulk" data-what="${what}" ${x.jobs ? '' : 'disabled'}>${label}<small>${x.jobs ? `${x.n} car${x.n > 1 ? 's' : ''} \u00b7 ${$m(x.cost)}${what !== 'inspect' ? ` \u00b7 +${$m(x.gain)} value` : ''}` : 'nothing to do'}</small></button>`; };
    const stale = DW.staleCars(S, 21).length;
    return `<div class="card"><h2>Manage the whole lot</h2>
      <div class="bulk">${b('smart', '\u2728 Smart fix-up')}${b('detail', '\u{1F9FD} Detail all')}${b('mech', '\u{1F527} Repair all')}${b('body', '\u{1F3A8} Repaint all')}${b('inspect', '\u{1F50D} Inspect all')}
        <button class="btn" data-act="bulkwholesale" ${stale ? '' : 'disabled'}>\u{1F69A} Wholesale stale<small>${stale} car${stale === 1 ? '' : 's'} on the lot 21+ days</small></button></div>
      <p class="small muted" style="margin:6px 0">Smart fix-up only does jobs that add more value than they cost.</p>
      <div class="row" style="margin-top:8px"><b class="small">Prices</b>
        <button class="btn small" data-act="bulkprice" data-pct="0">All to suggested</button>
        <select id="pricePct" aria-label="Price all at a percent of value">${[0.95, 1, 1.05, 1.1, 1.15].map(p => `<option value="${p}" ${p === 1.05 ? 'selected' : ''}>${Math.round(p * 100)}% of value</option>`).join('')}</select>
        <button class="btn small" data-act="bulkprice">Apply</button></div>
      <div class="row" style="margin-top:6px"><label class="small" for="autoPrice"><b>Auto-price every morning</b></label>
        <select id="autoPrice">${[[0, 'Off'], [1, '100% of value'], [1.05, '105% (suggested)'], [1.1, '110% of value']].map(([v, l]) => `<option value="${v}" ${Number(S.autoPrice) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>`;
  }
  function carDetail(car) {
    const m = DW.model(car), shown = DW.shownValue(S, car), [vc, vt] = verdict(car);
    let h = `<div class="card"><div class="car-card">${carIcon(car)}<div>
      <div class="title">${esc(DW.carName(car))}</div>
      <div class="small muted">${rarityBadge(m)} ${esc(DW.SEGMENTS[m.seg])} · ${esc(DW.COLORS[car.color][0])} · ${fmt(car.miles)} miles</div>
      ${DW.isCpo(S, car) ? '<span class="badge cpo">\u2705 Certified</span> ' : ''}${car.award ? '<span class="badge award">\u{1F3C6} Concours winner</span> ' : ''}${car.salvage ? '<span class="badge warn">Salvage title</span> ' : ''}${car.issue && car.issue.known ? `<span class="badge warn">${esc(car.issue.name)}</span> ` : ''}${car.inspected && !car.issue ? '<span class="badge ok">Inspected</span>' : ''}
    </div></div>${bars(car)}
    <div class="kv"><span>Market value</span><span>~${$m(shown)}${car.inspected ? '' : '*'}</span><span>You’ve put in</span><span>${$m(car.cost)}</span><span>Days on the lot</span><span>${S.day - car.bought}</span></div>
    ${car.inspected ? '' : '<p class="small muted">* Not inspected. It might be hiding a problem.</p>'}</div>`;
    if (!car.job) for (const r of wantedBy(car)) h += `<div class="card barn"><b>\u2B50 ${esc(r.who)}</b> wants exactly this car (until day ${r.until})!<div class="row" style="margin-top:6px"><button class="btn primary" data-act="request" data-id="${car.id}" data-req="${r.id}">Sell for ${$m(DW.requestPrice(S, car, r))}</button></div></div>`;
    if (!car.job && DW.concoursOk(S, car)) h += S.concours ? (S.concours.carId === car.id ? `<div class="card"><b>\u{1F3C6} Entered in the Concours</b> \u00b7 judged on day ${S.concours.day}. Keep it on the lot until then.</div>` : '')
      : `<div class="card row spread"><div><b>\u{1F3C6} Concours d\u2019Elegance</b><div class="small muted">Show it off on Friday. Win prize money, reputation, and an award that adds 8% to its value.</div></div><button class="btn small primary" data-act="concours" data-id="${car.id}">Enter ${$m(DW.CONCOURS_FEE)}</button></div>`;
    if (car.job) {
      h += `<div class="card"><b>\u{1F527} In the shop:</b> ${esc(DW.JOBS[car.job.kind].label)}, back on day ${car.job.done}.</div>`;
      return h;
    }
    h += `<div class="card"><h2>Asking price</h2>
      <div class="row"><button class="btn small" data-act="nudge" data-id="${car.id}" data-f="0.95">-5%</button>
      <input type="number" id="askInput" value="${car.ask}" min="100" step="100" aria-label="Asking price">
      <button class="btn small" data-act="nudge" data-id="${car.id}" data-f="1.05">+5%</button>
      <button class="btn small" data-act="suggest" data-id="${car.id}">Suggested</button></div>
      <div class="verdict ${vc}">${vt}</div>
      <div class="small">If it sells at this price: <b class="${car.ask - car.cost >= 0 ? 'pos' : 'neg'}">${car.ask - car.cost >= 0 ? '+' : '-'}${$m(Math.abs(car.ask - car.cost))}</b></div></div>`;
    h += `<div class="card"><h2>Fix it up</h2>`;
    for (const kind of ['mech', 'body', 'detail']) {
      const info = DW.jobGain(S, car, kind), gain = info.gain;
      h += `<div class="row spread" style="margin:6px 0"><div><b>${DW.JOBS[kind].label}</b><div class="small muted">${info.worth ? `${Math.round(info.from)} \u2192 ${info.target} \u00b7 ${info.days ? info.days + ' day' + (info.days > 1 ? 's' : '') : 'instant'}${kind !== 'detail' && S.levels.shop && !info.inHouse ? ' (bays full, sent out)' : ''} \u00b7 value <span class="${gain > info.cost ? 'pos' : 'neg'}">+${$m(gain)}</span>` : 'Already as good as it gets'}</div></div>
        <button class="btn small" data-act="job" data-kind="${kind}" data-id="${car.id}" ${info.worth ? '' : 'disabled'}>${info.worth ? $m(info.cost) : 'Done'}</button></div>`;
    }
    if (!car.inspected) h += `<div class="row spread" style="margin:6px 0"><div><b>Inspection</b><div class="small muted">Find hidden problems before a buyer does</div></div><button class="btn small" data-act="inspect" data-id="${car.id}">${$m(Math.round(DW.inspectCost(car) * (S.levels.shop ? 0.4 : 1)))}</button></div>`;
    h += `<p class="small muted">Mechanical repair always finds and fixes hidden problems (they go on the bill). Selling a car with a hidden problem can come back to haunt you.</p></div>`;
    if (m.rarity >= 4) {
      const [lo, hi] = DW.consignRange(S, car);
      h += `<div class="card vip"><b>\u{1F48E} Consign to the VIP Invitational</b><div class="small muted">A sure sale for a car this special: billionaires bid on it at the Wednesday and Saturday invitational. You get about ${$m(lo)}–${$m(hi)} after the ${Math.round(DW.CONSIGN_FEE * 100)}% seller’s fee.</div>
        ${DW.canConsign(S, car) ? `<div class="row" style="margin-top:6px"><button class="btn small primary" data-act="consign" data-id="${car.id}">Put it on the block</button></div>`
        : `<div class="small" style="margin-top:4px">${DW.vipOpen(S) ? 'Open on Wednesdays and Saturdays.' : `Needs an invitation: ${DW.VIP_REP}+ reputation and a glass showroom.`}</div>`}</div>`;
    }
    h += `<div class="card row spread"><div><b>Wholesale it</b><div class="small muted">Sell right now to a wholesaler, no questions asked</div></div><button class="btn small danger" data-act="wholesale" data-id="${car.id}">${$m(DW.wholesaleOffer(S, car))}</button></div>`;
    return h;
  }
  function renderBuyTab() {
    let h = `<div class="sub-tabs"><button data-act="subtab" data-v="auction" aria-selected="${ui.buyTab === 'auction'}">${S.auction.collector ? '\u{1F451} ' : ''}Auction</button><button data-act="subtab" data-v="vip" aria-selected="${ui.buyTab === 'vip'}">${DW.vipOpen(S) && DW.isVipDay(S) ? '\u{1F48E} ' : ''}VIP</button><button data-act="subtab" data-v="ads" aria-selected="${ui.buyTab === 'ads'}">Classifieds (${S.classifieds.ads.length})</button></div>`;
    h += `<p class="small muted">Cash ${$m(S.cash)} · ${DW.freeSpaces(S)} free space${DW.freeSpaces(S) === 1 ? '' : 's'} on your lot</p>`;
    if (ui.buyTab === 'vip') h += renderVip();
    else if (ui.buyTab === 'auction') {
      h += `<h2>${S.auction.collector ? 'Collector car auction' : 'Dealer auto auction'}</h2><p class="small muted">Set the most you’re willing to pay. Other dealers bid too; the highest secret max wins, at just above the runner-up. Buyer’s fee: 5% + $150. Auction cars are sold as-is.</p>`;
      S.auction.lots.forEach((lot, i) => {
        const car = lot.car, m = DW.model(car), v = DW.shownValue(S, car);
        h += `<div class="card ${lot.done ? (lot.done.won ? 'won' : 'lost') : ''}"><div class="car-card">${carIcon(car)}<div>
          <div class="title">${esc(DW.carName(car))} ${rarityBadge(m)}</div>
          <div class="small muted">${fmt(car.miles)} mi · ${esc(DW.COLORS[car.color][0])} · condition report: <b>${grade(DW.apparentMech(car))}</b> mech / <b>${grade(car.body)}</b> body / <b>${grade(car.detail)}</b> detail</div>
          <div class="small">Looks worth about <span class="money">${$m(v)}</span> · opening bid ${$m(lot.start)}</div>
          ${lot.done ? `<div class="small" style="margin-top:4px"><b>${lot.done.won ? `✅ Yours for ${$m(lot.done.price)}` : `❌ Sold to another dealer for ${$m(lot.done.price)}`}</b></div>`
          : `<div class="row" style="margin-top:6px"><input type="number" id="bid${i}" value="${DW.util.nicePrice(v * 0.75)}" step="100" aria-label="Your maximum bid"><button class="btn primary small" data-act="bid" data-i="${i}">Place max bid</button></div>`}
        </div></div></div>`;
      });
    } else {
      h += `<h2>Classified ads</h2><p class="small muted">Private sellers. Some have no clue what their car is worth, some are hiding problems. Pay for an inspection, or roll the dice. Haggle, but don’t insult them.</p>`;
      for (const ad of S.classifieds.ads) {
        const car = ad.car, m = DW.model(car);
        h += `<div class="card ${ad.barn ? 'barn' : ''}"><div class="car-card">${carIcon(car)}<div>
          <div class="title">${ad.barn ? '\u{1F3DA}️ ' : ''}FOR SALE: ${esc(DW.carName(car))} ${m.rarity >= 2 ? rarityBadge(m) : ''}</div>
          <div class="small">“${esc(ad.blurb)}” <span class="muted">— ${esc(ad.seller)}, posted ${S.day - ad.posted ? `${S.day - ad.posted}d ago` : 'today'}</span></div>
          <div class="small muted">${fmt(car.miles)} mi · ${esc(DW.COLORS[car.color][0])}${car.inspected ? ` · ${car.issue ? `<span class="neg">${esc(car.issue.name)}</span>` : '<span class="pos">no hidden problems</span>'}${car.salvage ? ' · <span class="neg">SALVAGE title</span>' : ''}` : ''}</div>
          ${bars(car)}
          ${(() => { const worth = DW.shownValue(S, car), d = worth - ad.ask; return `<div class="small">Asking <b>${$m(ad.ask)}</b> \u00b7 looks worth ~<b class="${d >= 0 ? 'pos' : 'neg'}">${$m(worth)}</b> <span class="${d >= 0 ? 'pos' : 'neg'}">(${d >= 0 ? `${$m(d)} under value` : `${$m(-d)} over value`})</span></div>`; })()}
          ${ad.angry ? '<div class="small neg" style="margin-top:4px">The seller blocked you.</div>' : `<div class="row" style="margin-top:6px">
            <input type="number" id="offer${ad.id}" value="${DW.util.nicePrice(ad.ask * 0.85)}" step="100" aria-label="Your offer">
            <button class="btn small primary" data-act="offer" data-id="${ad.id}">Offer</button>
            <button class="btn small" data-act="buyad" data-id="${ad.id}">Buy at ${$m(ad.ask)}</button>
            ${car.inspected ? '' : `<button class="btn small" data-act="inspectad" data-id="${ad.id}">Inspect ${$m(DW.inspectCost(car))}</button>`}</div>`}
        </div></div></div>`;
      }
    }
    return h;
  }
  function renderVip() {
    if (!DW.vipOpen(S)) {
      return `<div class="card vip"><h2>\u{1F48E} VIP Invitational</h2><p class="small">Twice a week, the richest collectors in the country bid on Legendary and <b>Mythic</b> cars: 250 GTOs, McLaren F1s, Miuras. Invitation only.</p>
        <div class="kv small"><span>Reputation ${DW.VIP_REP}+</span><span class="${S.rep >= DW.VIP_REP ? 'pos' : 'neg'}">${Math.round(S.rep)}/${DW.VIP_REP}</span><span>Glass showroom or better</span><span class="${S.levels.showroom >= 2 ? 'pos' : 'neg'}">${S.levels.showroom >= 2 ? 'Yes' : 'Not yet'}</span></div>
        <p class="small muted">Getting in also brings whale buyers with eight-figure budgets to your lot.</p></div>`;
    }
    if (!DW.isVipDay(S)) { const d = [3, 6].map(x => (x - (S.day % 7) + 7) % 7).filter(x => x > 0).sort((a, b) => a - b)[0]; return `<div class="card vip"><h2>\u{1F48E} VIP Invitational</h2><p>The next invitational is on <b>${d === 1 ? 'tomorrow' : `day ${S.day + d}`}</b> (${DAYS[(S.day + d - 1) % 7]}). It runs every Wednesday and Saturday.</p></div>`; }
    let h = `<h2>\u{1F48E} VIP Invitational</h2><p class="small muted">Legendary and Mythic cars in top shape. The other bidders are billionaires, museums and royalty, and they don\u2019t mind paying full price. Buyer\u2019s premium: 10% + $5,000.</p>`;
    DW.vipLots(S).forEach((lot, i) => {
      const car = lot.car, m = DW.model(car), v = DW.shownValue(S, car);
      h += `<div class="card vip ${lot.done ? (lot.done.won ? 'won' : 'lost') : ''}"><div class="car-card">${carIcon(car)}<div>
        <div class="title">${esc(DW.carName(car))} ${rarityBadge(m)}</div>
        <div class="small muted">${fmt(car.miles)} mi \u00b7 ${esc(DW.COLORS[car.color][0])} \u00b7 <b>${grade(DW.apparentMech(car))}</b> mech / <b>${grade(car.body)}</b> body / <b>${grade(car.detail)}</b> detail</div>
        <div class="small">Estimate <span class="money">${$m(v)}</span> \u00b7 opening bid ${$m(lot.start)}</div>
        ${lot.done ? `<div class="small" style="margin-top:4px"><b>${lot.done.won ? `\u2705 Yours for ${$m(lot.done.price)}` : `\u274C ${esc(lot.done.who)} took it for ${$m(lot.done.price)}`}</b></div>`
        : `<div class="row" style="margin-top:6px"><input type="number" id="vbid${i}" value="${DW.util.nicePrice(v * 0.9)}" step="1000" aria-label="Your maximum bid"><button class="btn primary small" data-act="vipbid" data-i="${i}">Place max bid</button></div>`}
      </div></div></div>`;
    });
    return h;
  }
  function renderUpgradesTab() {
    let h = `<h2>Grow your dealership</h2><p class="small muted">Upgrades cost money up front plus a daily upkeep. Today’s bills: <b>${$m(DW.overhead(S))}</b>/day.</p>`;
    const effects = {
      lot: l => `${l.spaces} parking spaces`,
      showroom: l => (l.traffic ? `+${l.traffic} customers/day, rich buyers pay ${Math.round(l.premium * 100)}% more` : 'Basic office'),
      shop: l => (l.bays === 99 ? 'Repairs sent out: full price, 2\u20133 days' : `${l.bays} bay${l.bays > 1 ? 's' : ''}, repairs ${Math.round((1 - l.costMult) * 100)}% cheaper, ${l.days ? l.days + ' day' : 'same day'}, up to ${l.max}/100${l.bays >= 3 ? ', free inspection of every car you buy' : ''}`),
      detail: l => (l.instant ? `Instant details, ${Math.round((1 - l.costMult) * 100)}% cheaper` : 'Details sent out: full price, 1 day'),
      finance: l => (l.buyers ? `+${Math.round(l.buyers * 100)}% buyer budgets, +${Math.round(l.markup * 100)}% on financed deals` : 'Cash buyers only'),
      billboard: l => (l.traffic ? `+${l.traffic} customer${l.traffic > 1 ? 's' : ''}/day` : 'Nobody knows you exist'),
      insurance: l => (l.perDay ? 'Covers hail, and pays 80% if a car is stolen' : 'Hail and theft are your problem'),
      cpo: l => (l.cost ? 'Inspected, clean-title cars in 80+ condition get certified: buyers pay 6% more and every sale builds reputation' : 'No certified cars'),
    };
    for (const [key, u] of Object.entries(DW.UPGRADES)) {
      const cur = u.levels[S.levels[key]], next = u.levels[S.levels[key] + 1];
      h += `<div class="card upgrade"><div class="row spread"><div><b>${u.icon} ${u.label}</b><div class="small muted">Now: ${cur.name} · ${effects[key](cur)}</div></div></div>
        ${next ? `<div class="next row spread"><div class="small">Next: <b>${next.name}</b> · ${effects[key](next)} · <span class="muted">${$m(next.perDay)}/day</span></div>
        <button class="btn small primary" data-act="upgrade" data-key="${key}" ${next.cost > S.cash ? 'disabled' : ''}>${$m(next.cost)}</button></div>` : '<div class="small pos next">Maxed out!</div>'}</div>`;
    }
    h += `<h2 style="margin-top:14px">Advertising</h2><p class="small muted">More customers while it runs (and inflatable tube men!).</p>`;
    for (const ad of DW.ADS) {
      const on = S.ads.find(a => a.id === ad.id);
      h += `<div class="card row spread"><div><b>${ad.name}</b><div class="small muted">+${ad.traffic} customers/day for ${ad.days} days${ad.rep ? `, +${ad.rep} reputation` : ''}</div></div>
        ${on ? `<span class="small pos">Running until day ${on.until}</span>` : `<button class="btn small" data-act="runad" data-id="${ad.id}" ${ad.cost > S.cash ? 'disabled' : ''}>${$m(ad.cost)}</button>`}</div>`;
    }
    return h;
  }
  function renderEmpireTab() {
    const t = DW.tier(S), next = DW.REP_TIERS.find(x => x.min > S.rep);
    let h = `<h2>${esc(t.name)}</h2><div class="card"><div class="row spread"><b>Reputation ${Math.round(S.rep)}/100</b><span class="small muted">${next ? `${next.name} at ${next.min}` : 'Top of the world'}</span></div>
      <div class="tier-bar"><i style="width:${S.rep}%"></i></div>
      <div class="small"><b>Builds it:</b> every sale, cars in great shape, Certified cars, client requests, Concours ribbons, trophies, ads, upgrades, a showroom.
      <br><b>Hurts it:</b> lemons coming back (inspect or repair before you sell!), customers nobody helps, Big Tony\u2019s guys.</div>
      ${next && next.perk ? `<p class="small muted">${esc(next.name)} unlocks: ${esc(next.perk)}.</p>` : ''}</div>`;
    h += `<h2 style="margin-top:14px">\u2B50 Client requests (${S.requests.length}/3)</h2>`;
    if (!S.requests.length) h += '<p class="small muted">No requests right now. Rich clients call in every few days.</p>';
    for (const r of S.requests) {
      const m = DW.MODELS[r.mid], have = S.cars.filter(c => c.mid === r.mid);
      h += `<div class="card req ${have.length ? 'have' : ''}"><div class="row spread"><div><b>${esc(r.who)}</b> wants a <b>${esc(m.make)} ${esc(m.model)}</b> ${rarityBadge(m)}
        <div class="small muted">Pays ${Math.round((r.mult - 1) * 100)}% over value \u00b7 until day ${r.until} \u00b7 +${r.rep} reputation</div></div>
        ${have.length ? `<button class="btn small primary" data-act="select" data-id="${have[0].id}">You have one!</button>` : '<span class="small muted">Find one at auction or in the classifieds</span>'}</div></div>`;
    }
    h += `<h2 style="margin-top:14px">\u{1F3C6} Concours d\u2019Elegance</h2><div class="card small">`;
    if (S.concours) { const car = S.cars.find(c => c.id === S.concours.carId); h += `Entered: <b>${car ? esc(DW.carName(car)) : 'a car you no longer have'}</b>. Judging on day ${S.concours.day}.`; }
    else { const ok = S.cars.filter(c => DW.concoursOk(S, c)); h += `Every Friday. Enter a Rare-or-better car in 85+ condition (${$m(DW.CONCOURS_FEE)}). A win pays at least $25,000, boosts your reputation, and makes the car an award winner (+8% value). ${ok.length ? `<br><b>Eligible now:</b> ${ok.slice(0, 4).map(c => `<button class="btn small" data-act="select" data-id="${c.id}">${esc(DW.carName(c))}</button>`).join(' ')}` : '<br>No eligible cars yet: fully restore a rare one.'}`; }
    h += `</div><h2 style="margin-top:14px">\u{1F3E2} Branch dealerships</h2><p class="small muted">Each branch sends you a cut every night (more with a better reputation). It counts as money earned.</p>`;
    for (const b of DW.BRANCHES) {
      const own = S.branches.includes(b.id);
      h += `<div class="card row spread"><div><b>${esc(b.name)}</b><div class="small muted">~${$m(DW.branchIncome(S, b))}/night \u00b7 needs ${b.rep}+ reputation</div></div>
        ${own ? '<span class="small pos">Open</span>' : `<button class="btn small primary" data-act="branch" data-id="${b.id}" ${S.rep >= b.rep && b.cost <= S.cash ? '' : 'disabled'}>${$m(b.cost)}</button>`}</div>`;
    }
    const got = DW.TROPHIES.filter(x => S.trophies[x.id]).length;
    h += `<h2 style="margin-top:14px">\u{1F3C6} Trophy case (${got}/${DW.TROPHIES.length})</h2><div class="trophies">${DW.TROPHIES.map(x => `<div class="trophy ${S.trophies[x.id] ? 'got' : ''}"><b>${S.trophies[x.id] ? '\u{1F3C6}' : '\u{1F512}'} ${esc(x.name)}</b>${esc(x.desc)}${S.trophies[x.id] ? `<div class="muted">Day ${S.trophies[x.id]}</div>` : ''}</div>`).join('')}</div>`;
    return h;
  }
  const stars = n => `<span class="stars">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
  function renderStaffTab() {
    let h = `<h2>Sales team (${S.staff.length}/${DW.maxStaff(S)})</h2><p class="small muted">Each salesman can help ${DW.PER_SALESMAN} customers a day; anyone past that leaves annoyed. Better salesmen squeeze more money out of every deal, and they improve as they sell.</p>`;
    for (const p of S.staff) {
      const trainable = p.skill < 5 && S.day - (p.trained || 0) >= 7;
      h += `<div class="card row spread"><div><b>${esc(p.name)}</b> ${stars(p.skill)}<div class="small muted">${$m(p.wage)}/day \u00b7 ${p.sold} cars sold</div></div><div class="row">
        ${p.skill < 5 ? `<button class="btn small" data-act="train" data-id="${p.id}" ${trainable && DW.trainCost(p) <= S.cash ? '' : 'disabled'} title="${trainable ? 'One more star' : 'Back from training on day ' + ((p.trained || 0) + 7)}">Train ${$m(DW.trainCost(p))}</button>` : ''}
        <button class="btn small danger" data-act="fire" data-id="${p.id}" ${S.staff.length <= 1 ? 'disabled' : ''}>Fire</button></div></div>`;
    }
    h += `<h3>Looking for work (new faces on day ${S.hireDay})</h3>
      <div class="card row spread"><div><b>\u{1F4BC} Call a headhunter</b><div class="small muted">A fresh list right now, 3 stars and up. Better reputation draws better people.</div></div><button class="btn small" data-act="headhunter" ${DW.headhunterFee(S) > S.cash ? 'disabled' : ''}>${$m(DW.headhunterFee(S))}</button></div>`;
    if (!S.hirePool.people.length) h += `<p class="muted small">Nobody right now. New applicants on day ${S.hireDay}.</p>`;
    for (const p of S.hirePool.people) h += `<div class="card row spread"><div><b>${esc(p.name)}</b> ${stars(p.skill)}<div class="small muted">${$m(p.wage)}/day · signing bonus ${$m(DW.hireFee(p))}</div></div><button class="btn small primary" data-act="hire" data-id="${p.id}" ${S.staff.length >= DW.maxStaff(S) || DW.hireFee(p) > S.cash ? 'disabled' : ''}>Hire</button></div>`;
    if (S.staff.length >= DW.maxStaff(S)) h += `<p class="small muted">No more desks. A bigger lot or showroom makes room for more salesmen.</p>`;
    return h;
  }
  function renderBankTab() {
    const limit = DW.bankLimit(S), sLimit = DW.sharkLimit(S);
    return `<h2>\u{1F3E6} First National Bank</h2>
      <div class="card"><div class="kv"><span>You owe</span><span class="${S.bank ? 'neg' : ''}">${$m(S.bank)}</span><span>Credit limit</span><span>${$m(limit)}</span><span>Interest</span><span>${(DW.rates.BANK_RATE * 100).toFixed(1)}% a day</span></div>
      <p class="small muted">Your limit grows with your cash, inventory and reputation. Interest is added to the loan every night.</p>
      <div class="row"><input type="number" id="bankAmt" value="${Math.max(0, Math.min(5000, limit - S.bank))}" step="500" aria-label="Amount"><button class="btn small primary" data-act="borrow" data-who="bank">Borrow</button><button class="btn small" data-act="repay" data-who="bank" ${S.bank ? '' : 'disabled'}>Repay</button><button class="btn small" data-act="repayall" data-who="bank" ${S.bank ? '' : 'disabled'}>Repay all</button></div></div>
      <h2 style="margin-top:14px">\u{1F574}️ Big Tony</h2>
      <div class="card"><p class="small">"Bank turned you down? I don’t ask questions. But I charge for it, and I don’t like waiting."</p>
      <div class="kv"><span>You owe</span><span class="${S.shark ? 'neg' : ''}">${$m(S.shark)}</span><span>He’ll lend up to</span><span>${$m(sLimit)}</span><span>Interest</span><span>${(DW.rates.SHARK_RATE * 100).toFixed(1)}% a day</span>${S.shark ? `<span>Due</span><span class="neg">Day ${S.sharkDue}</span>` : ''}</div>
      <p class="small muted">Pay him back within ${DW.rates.SHARK_DAYS} days, or his guys start towing your best cars.</p>
      <div class="row"><input type="number" id="sharkAmt" value="5000" step="500" aria-label="Amount"><button class="btn small danger" data-act="borrow" data-who="shark">Borrow</button><button class="btn small" data-act="repay" data-who="shark" ${S.shark ? '' : 'disabled'}>Repay</button><button class="btn small" data-act="repayall" data-who="shark" ${S.shark ? '' : 'disabled'}>Repay all</button></div></div>`;
  }
  function sparkline(vals) {
    if (vals.length < 2) return '<p class="small muted">Play a few days to see your net worth chart.</p>';
    const lo = Math.min(...vals, 0), hi = Math.max(...vals, 1), W = 360, H = 80;
    const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * W},${H - ((v - lo) / (hi - lo)) * H}`).join(' ');
    return `<svg viewBox="-2 -4 ${W + 4} ${H + 8}" width="100%" height="90" aria-label="Net worth over the last ${vals.length} days"><polyline points="${pts}" fill="none" stroke="#4cd38a" stroke-width="2.5"/></svg>`;
  }
  function renderNewsTab() {
    const segs = Object.entries(S.market).map(([k, v]) => `<span>${DW.SEGMENTS[k]}</span><span class="${v > 1.03 ? 'pos' : v < 0.97 ? 'neg' : ''}">${v > 1.03 ? '▲' : v < 0.97 ? '▼' : '•'} ${Math.round((v - 1) * 100)}%</span>`).join('');
    return `<h2>Career</h2><div class="card"><div class="kv">
      <span>Money earned (all time)</span><span class="money">${$m(S.earned)}</span><span>Cars sold (all time)</span><span>${fmt(S.carsSold)}</span>
      <span>This dealership</span><span>${$m(S.runEarned)} · ${S.runSold} cars</span><span>Biggest sale</span><span>${$m(S.best.sale)}</span><span>Best flip</span><span>${$m(S.best.flip)}</span><span>Best day</span><span>${$m(S.best.day)}</span>
      ${S.runs > 1 ? `<span>Dealerships run</span><span>${S.runs}</span>` : ''}</div></div>
      <h3>Net worth</h3>${sparkline(S.history)}
      <h3>Used car market</h3><div class="card kv">${segs}</div>
      <h3>News</h3><div class="feed">${S.log.slice(0, 40).map(e => `<div class="${e.kind}"><i>Day ${e.day}</i>${esc(e.text)}</div>`).join('')}</div>`;
  }

  // ---------- actions ----------
  function toast(msg, kind) {
    if (!msg) return;
    const el = document.createElement('div');
    el.className = `toast ${kind || ''}`; el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3800);
    while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
  }
  function result(r, okKind) { if (!r) return; toast(r.msg, r.ok ? (r.won === false ? 'bad' : okKind || 'good') : 'bad'); if (r.ok) { save(); } render(); }
  function onPanelClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const id = Number(b.dataset.id), act = b.dataset.act;
    const car = S.cars.find(c => c.id === id);
    if (act === 'select') { ui.sel = id; render(); return; }
    if (act === 'subtab') { ui.buyTab = b.dataset.v; renderPanel(); return; }
    if (ui.running && !['select'].includes(act)) { toast('Wait until the day is over.', 'bad'); return; }
    if (act === 'nudge') { car.ask = U.nicePrice(car.ask * Number(b.dataset.f)); save(); render(); return; }
    if (act === 'suggest') { car.ask = DW.suggestPrice(S, car); save(); render(); return; }
    if (act === 'job') return result(DW.startJob(S, id, b.dataset.kind));
    if (act === 'inspect') return result(DW.inspectCar(S, id));
    if (act === 'wholesale') { const r = DW.wholesale(S, id); if (r.ok) ui.sel = null; return result(r, 'money'); }
    if (act === 'request') { const r = DW.sellToRequest(S, id, Number(b.dataset.req)); if (r.ok) { ui.sel = null; kgEvent('client_sale', { car: DW.carName(car) }); trophies(); } return result(r, 'money'); }
    if (act === 'concours') return result(DW.enterConcours(S, id));
    if (act === 'consign') { const r = DW.consign(S, id); if (r.ok) { ui.sel = null; kgEvent('big_sale', { car: DW.carName(car), consigned: true }); trophies(); } return result(r, 'money'); }
    if (act === 'vipbid') { const i = Number(b.dataset.i); return result(DW.vipBid(S, i, Number($(`vbid${i}`).value))); }
    if (act === 'branch') { const r = DW.buyBranch(S, b.dataset.id); if (r.ok) trophies(); return result(r, 'money'); }
    if (act === 'headhunter') return result(DW.headhunter(S));
    if (act === 'train') return result(DW.train(S, id));
    if (act === 'bulk') return bulkConfirm(b.dataset.what);
    if (act === 'bulkprice') return result(DW.bulkPrice(S, b.dataset.pct === '0' ? 0 : Number($('pricePct').value)));
    if (act === 'bulkwholesale') return bulkWholesaleConfirm();
    if (act === 'bid') { const i = Number(b.dataset.i); return result(DW.bid(S, i, Number($(`bid${i}`).value))); }
    if (act === 'offer') return result(DW.offerAd(S, id, Number($(`offer${id}`).value)));
    if (act === 'buyad') { const ad = S.classifieds.ads.find(a => a.id === id); return result(ad && DW.offerAd(S, id, ad.ask)); }
    if (act === 'inspectad') return result(DW.inspectAd(S, id));
    if (act === 'upgrade') { const r = DW.upgrade(S, b.dataset.key); if (r.ok) { drawScene(); kgEvent('upgrade', { what: b.dataset.key, level: S.levels[b.dataset.key] }); } return result(r); }
    if (act === 'runad') { const r = DW.runAd(S, b.dataset.id); if (r.ok) drawScene(); return result(r); }
    if (act === 'hire') return result(DW.hire(S, id));
    if (act === 'fire') return result(DW.fire(S, id));
    if (act === 'borrow') return result(DW.borrow(S, b.dataset.who, Number($(b.dataset.who === 'bank' ? 'bankAmt' : 'sharkAmt').value)));
    if (act === 'repay') return result(DW.repay(S, b.dataset.who, Number($(b.dataset.who === 'bank' ? 'bankAmt' : 'sharkAmt').value)));
    if (act === 'repayall') return result(DW.repay(S, b.dataset.who, b.dataset.who === 'bank' ? S.bank : S.shark));
  }
  const BULK_LABEL = { smart: 'Smart fix-up', detail: 'Detail all', mech: 'Repair all', body: 'Repaint all', inspect: 'Inspect all' };
  async function bulkConfirm(what) {
    const x = bulkSummary(what);
    const r = await modal(`<h2>${BULK_LABEL[what]}</h2><p>${x.jobs} job${x.jobs > 1 ? 's' : ''} on ${x.n} car${x.n > 1 ? 's' : ''} for about <b>${$m(x.cost)}</b>${what !== 'inspect' ? `, adding about <b class="pos">${$m(x.gain)}</b> in value` : ''}.</p>
      ${x.cost > S.cash ? `<p class="neg small">You have ${$m(S.cash)}, so it\u2019ll stop when the cash runs out.</p>` : ''}${what !== 'detail' && what !== 'inspect' && !S.levels.shop ? '<p class="small muted">No shop of your own: these go out for a few days.</p>' : ''}`,
      [{ id: 'no', label: 'Cancel' }, { id: 'yes', label: 'Do it', cls: 'primary' }]);
    if (r.id === 'yes') result(DW.bulkRun(S, what));
  }
  async function bulkWholesaleConfirm() {
    const cars = DW.staleCars(S, 21), total = cars.reduce((t, c) => t + DW.wholesaleOffer(S, c), 0), cost = cars.reduce((t, c) => t + c.cost, 0);
    const r = await modal(`<h2>Wholesale stale cars</h2><p>${cars.length} car${cars.length > 1 ? 's have' : ' has'} sat 21+ days. The wholesaler pays <b>${$m(total)}</b> for them (you put in ${$m(cost)}).</p>`,
      [{ id: 'no', label: 'Keep them' }, { id: 'yes', label: 'Sell them all', cls: 'danger' }]);
    if (r.id === 'yes') { ui.sel = null; result(DW.bulkWholesale(S, 21), 'money'); }
  }
  function trophies() { for (const t of DW.checkTrophies(S)) toast(`\u{1F3C6} Trophy: ${t.name}!`, 'good'); }
  function onPanelChange(e) {
    if (e.target.id === 'autoPrice') { S.autoPrice = Number(e.target.value); if (S.autoPrice) DW.bulkPrice(S, S.autoPrice); toast(S.autoPrice ? `Auto-price on: every car is reset to ${Math.round(S.autoPrice * 100)}% of value each morning.` : 'Auto-price off.'); save(); render(); return; }
    if (e.target.id !== 'askInput') return;
    const car = S.cars.find(c => c.id === ui.sel);
    if (!car) return;
    car.ask = Math.max(100, Math.round(Number(e.target.value) || car.ask));
    save(); render();
  }
  function onSceneClick(e) {
    const g = e.target.closest('[data-car],[data-empty]');
    if (!g) return;
    if (g.dataset.car) { ui.sel = Number(g.dataset.car); ui.tab = 'lot'; }
    else { ui.tab = 'buy'; }
    render();
    if (window.innerWidth <= 1000) $('tabBody').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const kgEvent = (type, data) => { if (KG()) KG().event(type, data); };

  // ---------- modals ----------
  function modal(html, buttons) {
    return new Promise(resolve => {
      $('modal').innerHTML = `${html}<div class="actions">${buttons.map((b, i) => `<button type="button" class="btn ${b.cls || ''}" data-i="${i}">${b.label}</button>`).join('')}</div>`;
      $('modalBack').classList.remove('hidden');
      const first = $('modal').querySelector('input') || $('modal').querySelector('.actions .primary') || $('modal').querySelector('.actions button');
      if (first) setTimeout(() => first.focus(), 30);
      $('modal').onclick = e => {
        const btn = e.target.closest('.actions button');
        if (!btn) return;
        const b = buttons[Number(btn.dataset.i)];
        const value = b.read ? b.read() : undefined;
        if (b.validate && !b.validate(value)) return;
        $('modalBack').classList.add('hidden');
        $('modal').onclick = null;
        resolve({ id: b.id, value });
      };
    });
  }
  function help() {
    return modal(`<h2>How to play</h2><ul>
      <li><b>Buy cars</b> at the daily auction or from classified ads. Private sellers are often way off on price, and some are hiding problems. An inspection tells you for sure.</li>
      <li><b>Fix them up.</b> Mechanical, body and detail work all raise what a car is worth. Watch the "+value" next to each job.</li>
      <li><b>Price them right.</b> Buyers know roughly what a car is worth. A fair price sells; a greedy one makes people walk. Nobody pays $100k for a $1,000 beater.</li>
      <li><b>Open for business</b> and watch customers walk the lot. Some buy, some make offers you can accept or counter, some bring trade-ins.</li>
      <li><b>Grow:</b> a bigger lot, a showroom, your own shop and detail bay, more salesmen, ads, a finance office.</li>
      <li><b>Money:</b> the bank lends at 0.2% a day. Big Tony lends when the bank won’t. Don’t be late paying Tony.</li>
      <li><b>Rare cars</b> (⭐ rare, \u{1F451} legendary) show up at Sunday collector auctions and in barn-find ads. Collectors and celebrities pay big.</li>
      <li><b>Manage the whole lot</b> from the Lot tab: smart fix-up, detail/repair/repaint everything, set every price at once, or auto-price each morning.</li>
      <li><b>Empire:</b> reputation tiers, client requests, the Friday Concours d\u2019Elegance, branch dealerships and trophies. At 60 reputation with a glass showroom you\u2019re invited to the <b>VIP Invitational</b> (Mythic cars!) and whales start shopping your lot.</li>
      <li><b>High scores</b> rank you by money earned, then cars sold. They count across every dealership you run, even if one goes bust.</li></ul>`, [{ label: 'Let’s sell some cars', cls: 'primary' }]);
  }
  async function newGameFlow(carry) {
    const user = KG() && KG().user ? KG().user.username : '';
    const def = carry ? S.name : user ? `${user}’s Motors` : 'Kaotic Motors';
    const r = await modal(`<h2>${carry ? 'Start a new dealership' : 'Welcome to Dealer Wars'}</h2>
      <p>${carry ? 'Your money earned and cars sold carry over. Everything else starts fresh.' : 'You’ve got <b>$12,000</b>, a gravel lot with 6 spaces, one salesman, and two beaters. Turn it into an auto empire.'}</p>
      <label for="dealerIn" class="small muted">Name your dealership</label><input type="text" id="dealerIn" maxlength="28" value="${esc(def)}" style="width:100%;margin-top:4px">`,
      [{ label: 'Open the lot', cls: 'primary', read: () => $('dealerIn').value.trim() || def }]);
    S = DW.newGame(r.value, carry ? { earned: S.earned, carsSold: S.carsSold, revenue: S.revenue, runs: S.runs, best: S.best } : null);
    ui.sel = null; ui.tab = 'lot';
    drawScene(); render(); save(true);
    if (!carry) help();
  }

  // ---------- a business day ----------
  function person(color) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'person');
    g.innerHTML = `<g class="body"><ellipse cx="0" cy="12" rx="9" ry="4" fill="#000" opacity=".25"/><rect x="-7" y="-6" width="14" height="18" rx="6" fill="${color}"/><circle cx="0" cy="-11" r="7" fill="${U.pick(['#f1c7a1', '#c58c5c', '#8d5a3b', '#e0ac7e', '#5c3a24'])}"/></g><g class="bubble"></g>`;
    $('peopleLayer').appendChild(g);
    return g;
  }
  function moveTo(g, x, y, ms) { g.style.transitionDuration = `${ms / ui.speed}ms`; g.style.transform = `translate(${x}px, ${y}px)`; }
  function bubble(g, text, kind) {
    const w = Math.min(220, 14 + text.length * 6.4);
    const fill = kind === 'good' ? '#e8fff0' : kind === 'offer' ? '#fff6d8' : '#fff';
    g.querySelector('.bubble').innerHTML = `<g transform="translate(0,-26)"><rect x="${-w / 2}" y="-26" width="${w}" height="22" rx="8" fill="${fill}" stroke="#333"/><path d="M-5,-4 L0,4 L5,-4z" fill="${fill}" stroke="#333"/><rect x="-5" y="-6" width="10" height="3" fill="${fill}"/><text class="bubble-text" x="0" y="-11" text-anchor="middle" fill="#222">${esc(text)}</text></g>`;
  }
  function floatMoney(x, y, text) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('class', 'float-money'); t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('text-anchor', 'middle');
    t.textContent = text;
    $('fxLayer').appendChild(t);
    setTimeout(() => t.remove(), 1700);
  }
  async function driveOff(car) {
    const g = $('lotLayer').querySelector(`[data-car="${car.id}"]`);
    if (!g) return;
    g.classList.add('drive-off');
    g.style.transform = 'translateY(420px)'; g.style.opacity = '0';
    await sleep(700);
  }
  async function askTrade(v) {
    if (!v.trade || S.autoDeals) return false;
    const t = v.trade.car, shown = DW.shownValue(S, t);
    const r = await modal(`<h2>Trade-in?</h2><div class="car-card">${carIcon(t)}<div><b>${esc(DW.carName(t))}</b><div class="small muted">${fmt(t.miles)} mi · not inspected</div>${bars(t)}</div></div>
      <p>They want <b class="money">${$m(v.trade.credit)}</b> off the price for it. It looks worth about <b>${$m(shown)}</b>.</p>`,
      [{ id: 'no', label: 'Cash deal only' }, { id: 'yes', label: `Take the trade (${$m(v.trade.credit)})`, cls: 'primary' }]);
    return r.id === 'yes';
  }
  async function handleVisit(p, v, idx) {
    const g = person(U.pick(['#ff5a36', '#4aa8ff', '#4cd38a', '#b06ce0', '#ffcc33', '#e8e8e8', '#2d2f33']));
    const startX = idx % 2 ? 990 : -30;
    g.style.transform = `translate(${startX}px, 584px)`;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const target = v.car && S.cars.includes(v.car) ? spotXY(v.car.spot) : { x: v.kind === 'unserved' ? 140 : U.ri(120, 840), y: v.kind === 'unserved' ? 176 : 520 };
    const tx = target.x + (v.car ? Math.min(target.cw * 0.38, 60) : 0), ty = target.y + (v.car ? 4 : 0);
    moveTo(g, tx, ty, 1100);
    await sleep(1150);
    if (v.kind === 'buy') {
      bubble(g, U.pick(['I’ll take it!', 'SOLD! Where do I sign?', 'Perfect, I’m in!', 'My kids will love it!']), 'good');
      await sleep(700);
      const trade = await askTrade(v);
      const r = DW.closeSale(S, v, v.price, trade);
      if (r.ok) { soldFx(v.car, v.price, r.profit); await driveOff(v.car); }
    } else if (v.kind === 'offer') {
      bubble(g, `How about ${$m(v.offer)}?`, 'offer');
      await sleep(500);
      const res = S.autoDeals ? autoOffer(v) : await offerModal(p, v);
      if (res === 'gone') bubble(g, 'Then I’m out.');
      else { bubble(g, 'Deal!', 'good'); await sleep(400); const trade = await askTrade(v); const r = DW.closeSale(S, v, res, trade); if (r.ok) { soldFx(v.car, res, r.profit); await driveOff(v.car); } }
    } else bubble(g, v.text);
    await sleep(v.kind === 'buy' || v.kind === 'offer' ? 400 : 1200);
    render();
    g.querySelector('.bubble').innerHTML = '';
    moveTo(g, startX > 0 ? -30 : 990, 584, 1300);
    setTimeout(() => g.remove(), 1400 / ui.speed);
  }
  function soldFx(car, price, profit) {
    const { x, y } = spotXY(car.spot);
    floatMoney(x, y - 10, `+${$m(price)}`);
    toast(`Sold the ${DW.carName(car)} for ${$m(price)} (${profit >= 0 ? 'profit' : 'loss'} ${$m(Math.abs(profit))})`, profit >= 0 ? 'good' : 'bad');
    if (DW.model(car).rarity >= 3 || profit >= 20000) kgEvent('big_sale', { car: DW.carName(car), price, profit });
  }
  // Auto-deal: take offers with some profit in them, try one counter on the rest
  function autoOffer(v) {
    const car = v.car;
    if (v.offer >= car.cost * 1.03) return v.offer;
    const counter = U.nicePrice(Math.max(car.cost * 1.08, (v.offer + car.ask) / 2));
    return counter <= car.ask && DW.counter(S, v, counter) ? counter : 'gone';
  }
  async function offerModal(p, v) {
    const car = v.car;
    let r = await modal(`<h2>Offer on the lot</h2><div class="offer-who"><div class="face">${U.pick(['\u{1F468}', '\u{1F469}', '\u{1F9D4}', '\u{1F475}', '\u{1F474}', '\u{1F9D1}‍\u{1F527}', '\u{1F920}'])}</div>
      <div><b>${esc(p.name)}</b>${p.collector ? ' <span class="badge r4">Collector</span>' : ''}<div class="small muted">wants the ${esc(DW.carName(car))}</div></div></div>
      <p>"I like it, but ${$m(car.ask)} is too much. I’ll give you"</p><div class="big-num">${$m(v.offer)}</div>
      <div class="kv small" style="margin-top:8px"><span>You’ve put in</span><span>${$m(car.cost)}</span><span>Profit at their offer</span><span class="${v.offer - car.cost >= 0 ? 'pos' : 'neg'}">${v.offer - car.cost >= 0 ? '+' : '-'}${$m(Math.abs(v.offer - car.cost))}</span></div>
      <div class="row" style="margin-top:10px"><label for="counterIn" class="small">Counter at</label><input type="number" id="counterIn" value="${U.nicePrice((v.offer + car.ask) / 2)}" step="100"></div>`,
      [{ id: 'no', label: 'No deal', cls: 'danger' }, { id: 'counter', label: 'Counter', read: () => Number($('counterIn').value) }, { id: 'yes', label: `Accept ${$m(v.offer)}`, cls: 'primary' }]);
    if (r.id === 'yes') return v.offer;
    if (r.id === 'no') return 'gone';
    const amount = Math.max(v.offer, Math.round(r.value || 0));
    if (DW.counter(S, v, amount)) { toast(`${p.name}: "Fine, ${$m(amount)}. You drive a hard bargain."`, 'good'); return amount; }
    toast(`${p.name}: "No way. I’m out."`, 'bad');
    return 'gone';
  }
  async function openForBusiness() {
    if (ui.running) return;
    if (!S.cars.some(c => !c.job)) { const r = await modal('<h2>Nothing to sell!</h2><p>Every car is in the shop or your lot is empty. Open anyway? You’ll still pay today’s bills.</p>', [{ id: 'no', label: 'Go buy cars' }, { id: 'yes', label: 'Open anyway', cls: 'primary' }]); if (r.id !== 'yes') { ui.tab = 'buy'; render(); return; } }
    ui.running = true; ui.sel = null;
    $('speedBox').classList.remove('hidden');
    render();
    const people = DW.planDay(S);
    toast(people.length ? `${people.length} customer${people.length > 1 ? 's' : ''} today!` : 'Dead day. Nobody showed up.', people.length ? '' : 'bad');
    let served = 0;
    const walking = [];
    for (let i = 0; i < people.length; i++) {
      const v = DW.visit(S, people[i], served);
      if (v.kind !== 'unserved' && !v.vip) served++;
      if (v.kind === 'buy' || v.kind === 'offer') { await Promise.all(walking.splice(0)); await handleVisit(people[i], v, i); }
      else { walking.push(handleVisit(people[i], v, i)); await sleep(650); }
    }
    await Promise.all(walking);
    await sleep(600);
    const report = DW.endDay(S);
    ui.running = false;
    $('speedBox').classList.add('hidden');
    $('peopleLayer').innerHTML = '';
    drawScene(); render(); save(true);
    await showReport(report);
    if (S.bankrupt) await bankrupt();
  }
  async function showReport(r) {
    const t = r.today;
    const lines = [['Cars sold', String(t.sold)], ['Sales', $m(t.revenue)], ['Profit on cars', `${t.profit >= 0 ? '+' : '-'}${$m(Math.abs(t.profit))}`], ...r.lines.map(([k, v]) => [k, `${v >= 0 ? '+' : '-'}${$m(Math.abs(v))}`])];
    const footfall = `${t.visitors} customer${t.visitors === 1 ? '' : 's'} came by${t.walked ? `, ${t.walked} left without buying` : ''}${t.unserved ? `, ${t.unserved} never got helped (hire more salesmen!)` : ''}.`;
    await modal(`<h2>End of day ${r.day}</h2><p class="small muted">${footfall}</p>
      <div class="report-lines">${lines.map(([k, v]) => `<span>${esc(k)}</span><b>${esc(v)}</b>`).join('')}</div>
      ${r.rep ? `<p class="small">Reputation ${Math.round(r.rep.from)} \u2192 <b>${Math.round(r.rep.to)}</b> <span class="${r.rep.to >= r.rep.from ? 'pos' : 'neg'}">(${r.rep.to >= r.rep.from ? '+' : ''}${(r.rep.to - r.rep.from).toFixed(1)})</span>${r.rep.complaints ? ` \u00b7 <span class="neg">${r.rep.complaints} lemon complaint${r.rep.complaints > 1 ? 's' : ''}: inspect or repair before selling</span>` : ''}${r.rep.unserved ? ` \u00b7 <span class="neg">${r.rep.unserved} customers never got helped</span>` : ''}</p>` : ''}
      ${r.trophies && r.trophies.length ? `<div class="feed">${r.trophies.map(t => `<div class="good">\u{1F3C6} Trophy unlocked: <b>${esc(t.name)}</b>, ${esc(t.desc)}</div>`).join('')}</div>` : ''}
      ${r.events.length ? `<h3>Overnight</h3><div class="feed">${r.events.map(e => `<div class="${e.kind}">${esc(e.text)}</div>`).join('')}</div>` : ''}
      <p class="small">Cash on hand: <b class="money">${$m(S.cash)}</b> · Net worth: <b>${$m(DW.netWorth(S))}</b></p>`,
      [{ label: `Start day ${S.day} ▶`, cls: 'primary' }]);
  }
  async function bankrupt() {
    kgEvent('bankrupt', { day: S.day, earned: S.runEarned });
    await modal(`<h2>\u{1F4B8} Bankrupt!</h2><p>${esc(S.name)} is out of cash and out of cars. The bank padlocked the gate on day ${S.day}.</p>
      <div class="kv"><span>This dealership earned</span><span>${$m(S.runEarned)}</span><span>Cars it sold</span><span>${S.runSold}</span><span>All-time money earned</span><span class="money">${$m(S.earned)}</span></div>
      <p class="small muted">Your all-time totals (and your high score) carry over.</p>`, [{ label: 'Start a new dealership', cls: 'primary' }]);
    await newGameFlow(true);
  }

  // ---------- start ----------
  function start() {
    $('tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { ui.tab = b.dataset.tab; renderPanel(); } });
    $('tabBody').addEventListener('click', onPanelClick);
    $('tabBody').addEventListener('change', onPanelChange);
    $('scene').addEventListener('click', onSceneClick);
    $('openBtn').addEventListener('click', () => openForBusiness().catch(err => { console.error(err); ui.running = false; render(); }));
    $('helpBtn').addEventListener('click', () => help());
    $('speedBox').addEventListener('click', e => { const b = e.target.closest('[data-speed]'); if (!b) return; ui.speed = Number(b.dataset.speed); for (const x of $('speedBox').children) x.classList.toggle('primary', x === b); });
    $('speedBox').children[0].classList.add('primary');
    $('autoDeals').addEventListener('change', e => { S.autoDeals = e.target.checked; save(); toast(S.autoDeals ? 'Auto-deal on: profitable offers are taken, trade-ins skipped.' : 'Auto-deal off: you’ll decide every offer.'); });
    if (KG()) { $('homeBtn').classList.remove('hidden'); $('homeBtn').addEventListener('click', () => KG().home()); }
    S = loadSave();
    if (S) { drawScene(); render(); showSaveState(); if (S.bankrupt) bankrupt(); }
    else newGameFlow(false);
    window.addEventListener('pagehide', () => { if (S) save(true); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
