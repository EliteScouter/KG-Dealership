// Balance check: a simple bot plays the game for a while, several times over.
//   node test.js [days] [runs]
// It isn't clever: it bids ~80% of what auction cars look worth, details and repairs when
// it pays off, prices at the suggested sticker, and takes reasonable offers and trade-ins.
'use strict';
require('./data.js');
require('./sim.js');
const DW = globalThis.DW;
const DAYS = Number(process.argv[2]) || 120, RUNS = Number(process.argv[3]) || 6;

function playDay(s, style) {
  // buy: auction lots that look cheap, then classified bargains
  for (let i = 0; i < s.auction.lots.length && DW.freeSpaces(s) > 0; i++) {
    const lot = s.auction.lots[i];
    const v = DW.shownValue(s, lot.car);
    if (v * 0.8 < s.cash * 0.6) DW.bid(s, i, v * style.bid);
  }
  for (const ad of [...s.classifieds.ads]) {
    if (DW.freeSpaces(s) < 1) break;
    const v = DW.shownValue(s, ad.car);
    if (ad.ask < v * 0.8 && ad.ask < s.cash * 0.6) { DW.inspectAd(s, ad.id); if (!ad.car.issue && !ad.car.salvage) DW.offerAd(s, ad.id, ad.ask * 0.88) ; }
  }
  // fix up: anything whose job adds more value than it costs
  for (const car of s.cars) {
    if (car.job) continue;
    for (const kind of ['detail', 'mech', 'body']) {
      if (car.job) break;
      const info = DW.jobInfo(s, car, kind);
      if (!info.worth || info.cost > s.cash * 0.5) continue;
      const before = DW.shownValue(s, car);
      const f = DW.JOBS[kind].field, old = car[f], oldIssue = car.issue;
      car[f] = info.target; if (kind === 'mech') car.issue = null;
      const after = DW.shownValue(s, car);
      car[f] = old; car.issue = oldIssue;
      if (after - before > info.cost * 1.15) DW.startJob(s, car.id, kind);
    }
    if (!car.job) car.ask = DW.suggestPrice(s, car);
    // stale inventory: drop the price
    if (s.day - car.bought > 8) car.ask = DW.util.nicePrice(DW.shownValue(s, car) * 0.97);
  }
  // upgrades when rich
  if (style.grow) for (const key of ['detail', 'lot', 'shop', 'showroom', 'finance', 'billboard', 'insurance']) {
    const next = DW.UPGRADES[key].levels[s.levels[key] + 1];
    if (next && s.cash > next.cost * 2.2) DW.upgrade(s, key);
  }
  if (style.grow && s.staff.length < DW.maxStaff(s) && s.cash > 15000) { const p = s.hirePool.people.sort((a, b) => b.skill - a.skill)[0]; if (p) DW.hire(s, p.id); }
  // sell
  const people = DW.planDay(s);
  let served = 0;
  for (const p of people) {
    const v = DW.visit(s, p, served);
    if (v.kind !== 'unserved' && !v.vip) served++;
    if (v.kind === 'buy') DW.closeSale(s, v, v.price, v.trade && v.trade.credit < DW.shownValue(s, v.trade.car) * 0.8);
    else if (v.kind === 'offer') {
      if (v.offer >= v.car.cost * 1.04) DW.closeSale(s, v, v.offer, false);
      else { const c = DW.util.nicePrice(Math.max(v.car.cost * 1.06, (v.offer + v.car.ask) / 2)); if (DW.counter(s, v, c)) DW.closeSale(s, v, c, false); }
    }
  }
  if (s.cash > 20000 && s.bank) DW.repay(s, 'bank', s.cash - 15000);
  return DW.endDay(s);
}

const styles = { cautious: { bid: 0.78, grow: true }, aggressive: { bid: 0.9, grow: true }, nogrow: { bid: 0.8, grow: false } };
for (const [name, style] of Object.entries(styles)) {
  const rows = [];
  for (let r = 0; r < RUNS; r++) {
    const s = DW.newGame('Test Motors');
    let bankruptDay = 0;
    const checkpoints = {};
    for (let d = 0; d < DAYS && !s.bankrupt; d++) { playDay(s, style); if ([30, 60].includes(s.day)) checkpoints[s.day] = DW.netWorth(s); if (s.bankrupt) bankruptDay = s.day; }
    rows.push({ net30: checkpoints[30], net60: checkpoints[60], netEnd: DW.netWorth(s), earned: s.earned, sold: s.carsSold, rep: Math.round(s.rep), lot: s.levels.lot, staff: s.staff.length, bankrupt: bankruptDay || '' });
  }
  console.log(`\n== ${name} (${DAYS} days x ${RUNS})`);
  console.table(rows);
}

// sanity: a $1,000 beater can never sell for anything like $100k
const s = DW.newGame('x');
const beater = DW.makeCar(s, { mid: DW.MODELS.findIndex(m => m.model === 'Cavalier'), profile: 'barn' });
beater.ask = 100000;
s.cars = [beater];
DW.planDay(s);
let sold = 0;
for (let i = 0; i < 2000; i++) { const v = DW.visit(s, { name: 't', budget: 5e6, seg: null, collector: false }, 0); s.today.visitors = 0; if (v.kind === 'buy' || v.kind === 'offer') sold++; }
console.log(`\nBeater worth $${DW.fmt(DW.value(s, beater))} at $100,000: buyers interested ${sold}/2000 (must be 0)`);
const fixed = DW.makeCar(s, { mid: beater.mid, profile: 'clean' });
console.log(`Same model, fixed up: worth $${DW.fmt(DW.value(s, fixed))}`);
