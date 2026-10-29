// ============================================================
//  Dealer Wars: the rules. Everything here works on one plain
//  state object (which is also the save), with no screen code,
//  so the economy can be tested on its own (node test.js).
// ============================================================
(function (DW) {
  'use strict';
  const YEAR_NOW = 2026;
  const SAVE_VERSION = 1;

  // ---------- little helpers ----------
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const chance = p => Math.random() < p;
  const round = (v, step) => Math.round(v / step) * step;
  const money = v => Math.round(v);
  function poisson(l) { let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }
  function weighted(items, w) { const tot = items.reduce((s, it) => s + w(it), 0); let r = Math.random() * tot; for (const it of items) { r -= w(it); if (r <= 0) return it; } return items[items.length - 1]; }
  const priceStep = v => (v < 2000 ? 50 : v < 20000 ? 100 : v < 100000 ? 500 : 1000);
  const nicePrice = v => Math.max(100, round(v, priceStep(v)));
  DW.util = { rnd, ri, pick, clamp, chance, round, nicePrice, priceStep };

  const model = car => DW.MODELS[car.mid];
  DW.model = model;
  DW.carName = car => `${car.year} ${model(car).make} ${model(car).model}`;
  DW.level = (s, key) => DW.UPGRADES[key].levels[s.levels[key]];
  DW.spaces = s => DW.level(s, 'lot').spaces;

  // ---------- what a car is worth ----------
  // the mechanical condition the car seems to have: a hidden problem stays hidden until someone looks
  DW.apparentMech = car => clamp(car.mech + (car.issue && !car.issue.known ? car.issue.dmg : 0), 0, 100);
  DW.condition = (car, perceived) => 0.45 * (perceived ? DW.apparentMech(car) : car.mech) + 0.35 * car.body + 0.2 * car.detail;
  function value(s, car, perceived) {
    const m = model(car);
    const exp = m.collectible ? 1.7 : 1.3;
    const c = DW.condition(car, perceived) / 100;
    const condMult = (0.25 + Math.pow(c, exp)) / (0.25 + Math.pow(0.65, exp));
    let yearAdj = 1;
    if (!m.collectible) yearAdj = clamp(1 + 0.055 * (car.year - (m.from + m.to) / 2), 0.55, 1.6);
    const expected = m.collectible ? 60000 : Math.max(15000, (YEAR_NOW - car.year) * 12000);
    const mileAdj = clamp(1.18 - 0.22 * car.miles / expected, 0.5, 1.2);
    const salvage = car.salvage && (!perceived || car.salvageKnown) ? 0.6 : 1;
    const market = (s && s.market && s.market[m.seg]) || 1;
    const award = car.award ? 1.08 : 1; // won a concours: collectors pay for the trophy
    return m.book * condMult * yearAdj * mileAdj * salvage * market * award;
  }
  DW.value = (s, car) => value(s, car, false);        // what it's really worth
  DW.shownValue = (s, car) => value(s, car, true);    // what it looks like it's worth (to you, and to buyers)

  // ---------- making cars ----------
  const PROFILES = {
    //            mech        body        detail     issue  salvage
    start:     [[35, 70], [35, 75], [25, 60], 0.1, 0],
    auction:   [[30, 88], [30, 92], [20, 80], 0.25, 0.05],
    classified:[[30, 92], [35, 95], [25, 90], 0.3, 0.04],
    barn:      [[8, 40], [15, 60], [3, 25], 0.35, 0],
    trade:     [[35, 85], [40, 88], [25, 75], 0.18, 0.02],
    clean:     [[70, 96], [70, 97], [60, 95], 0.05, 0],
  };
  DW.makeCar = function (s, opts = {}) {
    let pool = DW.MODELS;
    if (opts.mid != null) pool = [DW.MODELS[opts.mid]];
    else {
      // Mythic cars only turn up where something asks for them by rarity
      pool = pool.filter(m => (opts.rarity ? opts.rarity.includes(m.rarity) : m.rarity < 5));
      if (opts.segs) pool = pool.filter(m => opts.segs.includes(m.seg));
      if (opts.maxBook) pool = pool.filter(m => m.book <= opts.maxBook);
      if (!pool.length) pool = DW.MODELS.filter(m => m.rarity === 1);
    }
    const m = weighted(pool, x => [0, 10, 5, 1, 0.25, 0.2][x.rarity]);
    const p = PROFILES[opts.profile || 'auction'];
    const year = ri(m.from, m.to);
    const age = Math.max(1, YEAR_NOW - year);
    const miles = m.collectible ? round(rnd(6000, 150000), 100) : round(clamp(age * rnd(5500, 17000), 3000, 320000), 100);
    const car = {
      id: s ? s.nextId++ : 0, mid: m.id, year, miles, color: ri(0, DW.COLORS.length - 1),
      mech: ri(...p[0]), body: ri(...p[1]), detail: ri(...p[2]),
      issue: null, salvage: chance(p[4]), salvageKnown: false, inspected: false,
      cost: 0, bought: s ? s.day : 0, ask: 0, job: null,
    };
    if (chance(p[3])) { const [name, dmg] = pick(DW.ISSUES); car.issue = { name, dmg, known: false }; car.mech = clamp(car.mech - dmg, 3, 100); }
    return car;
  };

  // ---------- a new game ----------
  DW.newGame = function (name, carry) {
    const s = {
      v: SAVE_VERSION, name: String(name || 'Kaotic Motors').slice(0, 28), day: 1, cash: 12000, rep: 20,
      earned: carry ? carry.earned : 0, carsSold: carry ? carry.carsSold : 0, revenue: carry ? carry.revenue : 0, runs: carry ? carry.runs + 1 : 1,
      runEarned: 0, runSold: 0,
      bank: 0, shark: 0, sharkDue: 0,
      levels: { lot: 0, showroom: 0, shop: 0, detail: 0, finance: 0, billboard: 0, insurance: 0 },
      staff: [], cars: [], market: {}, effects: [], ads: [],
      auction: null, classifieds: null, hirePool: null, request: null, complaints: [],
      log: [], history: [], best: carry ? carry.best : { sale: 0, flip: 0, day: 0 },
      nextId: carry && carry.nextId ? carry.nextId : 1, bankrupt: false,
    };
    upgradeSave(s, carry);
    for (const k of Object.keys(DW.SEGMENTS)) s.market[k] = 1;
    // prestige perks bought with stars from earlier companies
    s.cash += 100000 * perk(s, 'cash');
    s.rep = clamp(s.rep + 10 * perk(s, 'rep'), 0, 100);
    s.levels.lot = perk(s, 'lot');
    s.staff.push({ id: s.nextId++, name: 'Mike Rossi', skill: 2, wage: 140, sold: 0 });
    for (let i = 0; i < 2; i++) {
      const car = DW.makeCar(s, { profile: 'start', rarity: [1], maxBook: 8000 });
      car.cost = money(DW.value(s, car) * 0.75);
      car.ask = DW.suggestPrice(s, car);
      s.cars.push(car);
    }
    refreshMarkets(s, true);
    DW.note(s, `Welcome to ${s.name}! You've got $12,000, a gravel lot and one salesman. Buy low, fix 'em up, sell high.`, 'good');
    return s;
  };

  // fields added after the first release: old saves get them on load, new games here
  function upgradeSave(s, carry) {
    s.levels.cpo = s.levels.cpo || 0;
    if (!Array.isArray(s.requests)) { s.requests = []; if (s.request) s.requests.push({ ...s.request, id: s.nextId++, rep: 4 }); }
    delete s.request;
    s.trophies = s.trophies || (carry && carry.trophies) || {};
    s.stats = Object.assign({ requests: 0, concoursWins: 0, mythicSold: 0, tonyPaid: 0, branchIncome: 0, contracts: 0, museumIncome: 0 }, (carry && carry.stats) || {}, s.stats || {});
    s.branches = s.branches || [];
    s.museum = s.museum || (carry && carry.museum) || { level: 0, cars: [] };
    s.dex = s.dex || (carry && carry.dex) || {};
    for (const c of [...s.cars, ...s.museum.cars]) if (!s.dex[c.mid]) s.dex[c.mid] = s.day;
    s.prestige = s.prestige || (carry && carry.prestige) || { stars: 0, perks: {}, count: 0, total: 0 };
    s.contracts = s.contracts || [];
    s.autoPrice = s.autoPrice || 0;
    s.hireDay = s.hireDay || s.day + 3;
    if (s.concours === undefined) s.concours = null;
    for (const p of s.staff) p.trained = p.trained || 0;
    return s;
  }
  DW.carryOver = s => ({ earned: s.earned, carsSold: s.carsSold, revenue: s.revenue, runs: s.runs, best: s.best, trophies: s.trophies, stats: s.stats,
    museum: s.museum, dex: s.dex, prestige: s.prestige, nextId: s.nextId });
  const perk = (s, id) => (s.prestige && s.prestige.perks[id]) || 0;
  DW.perk = perk;
  DW.note = (s, text, kind) => { s.log.unshift({ day: s.day, text, kind: kind || '' }); if (s.log.length > 80) s.log.length = 80; };
  DW.suggestPrice = (s, car) => nicePrice(DW.shownValue(s, car) * 1.05);
  DW.listPrice = (s, car) => (s.autoPrice ? nicePrice(DW.shownValue(s, car) * s.autoPrice) : DW.suggestPrice(s, car));
  DW.tier = s => DW.REP_TIERS.filter(t => s.rep >= t.min).pop();
  DW.vipOpen = s => s.rep >= (perk(s, 'vip') ? 40 : DW.VIP_REP) && s.levels.showroom >= 2;
  DW.isVipDay = s => [3, 6].includes(s.day % 7) || (perk(s, 'vip') > 0 && s.day % 7 === 1); // Wednesday and Saturday (and Monday with the black book)
  // the CPO program certifies inspected, clean-title cars in good shape
  DW.isCpo = (s, car) => s.levels.cpo > 0 && car.inspected && !car.salvage && !(car.issue && !car.issue.known) && DW.condition(car, false) >= 80;
  function addRep(s, amount) { s.rep = clamp(s.rep + amount, 0, 100); }
  DW.available = (s, car) => !car.job;
  DW.freeSpaces = s => DW.spaces(s) - s.cars.length;
  DW.inventoryValue = s => s.cars.reduce((t, c) => t + DW.value(s, c), 0);
  DW.museumValue = s => s.museum.cars.reduce((t, c) => t + DW.value(s, c), 0);
  DW.netWorth = s => money(s.cash + (DW.inventoryValue(s) + DW.museumValue(s)) * 0.85 - s.bank - s.shark);
  DW.overhead = s => Object.keys(s.levels).reduce((t, k) => t + DW.level(s, k).perDay, 0) + s.staff.reduce((t, p) => t + p.wage, 0);
  DW.branchIncome = (s, b) => money(b.income * (0.7 + s.rep * 0.006));
  DW.maxStaff = s => 1 + s.levels.lot + s.levels.showroom;
  DW.bankLimit = s => money(Math.max(0, 8000 + 0.4 * (s.cash + DW.inventoryValue(s) - s.shark) + s.rep * 400) / 100) * 100;
  DW.sharkLimit = s => 25000 + s.levels.lot * 15000;
  const BANK_RATE = 0.002, SHARK_RATE = 0.015, SHARK_DAYS = 21;
  DW.rates = { BANK_RATE, SHARK_RATE, SHARK_DAYS };

  function pay(s, amount) { s.cash = money(s.cash - amount); }

  // ---------- buying ----------
  function addCar(s, car, cost, how) {
    car.cost = money(cost); car.bought = s.day; car.job = null;
    if (car.salvage) car.salvageKnown = true; // the title paperwork shows it the moment it's yours
    if (s.levels.shop >= 2) reveal(car);      // a full service shop looks every arrival over for free
    if (!s.dex[car.mid]) s.dex[car.mid] = s.day; // the collection book
    car.ask = DW.listPrice(s, car);
    s.cars.push(car);
    DW.note(s, `Bought a ${DW.carName(car)} (${how}) for $${fmt(cost)}.` + (car.salvage && how !== 'trade-in' ? ' The title came back SALVAGE. Ouch.' : ''), car.salvage ? 'bad' : '');
  }
  const fmt = v => Math.round(v).toLocaleString('en-US');
  DW.fmt = fmt;

  // auction: a few lots a day; you set a hidden maximum bid against the other dealers
  DW.auctionFee = price => money(price * 0.05 + 150);
  function makeAuction(s) {
    const collector = s.day % 7 === 0;
    const n = 5 + Math.min(4, s.levels.lot);
    const lots = [];
    for (let i = 0; i < n; i++) {
      const rare = collector ? (chance(0.25) ? [4] : [3]) : chance(0.08) ? [3] : chance(0.3) ? [2] : [1];
      const car = DW.makeCar(s, { profile: 'auction', rarity: rare });
      const v = DW.shownValue(s, car);
      lots.push({ car, start: nicePrice(v * rnd(0.3, 0.45)), aiMax: v * (collector ? rnd(0.7, 0.98) : rnd(0.55, 0.9)), done: null });
    }
    s.auction = { day: s.day, collector, lots };
  }
  // the VIP Invitational: legendary and mythic cars, serious rivals, a 10% buyer's premium
  DW.vipFee = price => money(price * 0.1 + 5000);
  function makeVip(s) {
    const lots = [];
    for (let i = 0; i < 5; i++) {
      const car = DW.makeCar(s, { profile: 'clean', rarity: chance(0.45) ? [5] : [4] });
      const v = DW.shownValue(s, car);
      lots.push({ car, start: nicePrice(v * rnd(0.45, 0.6)), aiMax: v * rnd(0.78, 1.04), rival: pick(DW.WHALES), done: null });
    }
    s.vip = { day: s.day, lots };
  }
  DW.vipBid = function (s, lotIndex, maxBid) {
    if (!DW.vipOpen(s) || !DW.isVipDay(s)) return { ok: false, msg: 'The VIP Invitational isn\u2019t running today.' };
    if (!s.vip || s.vip.day !== s.day) makeVip(s);
    const lot = s.vip.lots[lotIndex];
    if (!lot || lot.done) return { ok: false, msg: 'That lot is gone.' };
    if (DW.freeSpaces(s) < 1) return { ok: false, msg: 'No room on your lot.' };
    maxBid = money(maxBid);
    if (!(maxBid >= lot.start)) return { ok: false, msg: `Bidding opens at $${fmt(lot.start)}.` };
    const inc = priceStep(lot.aiMax) * 5;
    if (maxBid <= lot.aiMax) {
      lot.done = { won: false, price: nicePrice(Math.max(lot.aiMax, maxBid + inc)), who: lot.rival };
      return { ok: true, won: false, msg: `Outbid by ${lot.rival} at $${fmt(lot.done.price)}.` };
    }
    const price = Math.max(lot.start, Math.min(maxBid, nicePrice(lot.aiMax + inc)));
    const total = price + DW.vipFee(price);
    if (total > s.cash) return { ok: false, msg: `You'd win at $${fmt(price)} plus a $${fmt(DW.vipFee(price))} premium, but you only have $${fmt(s.cash)}.` };
    pay(s, total);
    lot.done = { won: true, price };
    addCar(s, lot.car, total, 'VIP Invitational');
    return { ok: true, won: true, msg: `The hammer falls: yours for $${fmt(price)} (+$${fmt(DW.vipFee(price))} premium). ${lot.rival} is not happy.` };
  };
  // consign a Legendary or Mythic car to the VIP Invitational: it always sells, at whatever the room pays
  DW.CONSIGN_FEE = 0.06;
  DW.consignRange = (s, car) => { const v = DW.shownValue(s, car); return [v * 0.92 * (1 - DW.CONSIGN_FEE), v * 1.15 * (1 - DW.CONSIGN_FEE)]; };
  DW.canConsign = (s, car) => model(car).rarity >= 4 && !car.job && DW.vipOpen(s) && DW.isVipDay(s);
  DW.consign = function (s, carId) {
    const car = s.cars.find(c => c.id === carId);
    if (!car || !DW.canConsign(s, car)) return { ok: false, msg: 'Consignment is only open at the VIP Invitational (Wednesdays and Saturdays).' };
    s.today = s.today || newToday();
    const hammer = nicePrice(DW.shownValue(s, car) * rnd(0.92, 1.15)), fee = money(hammer * DW.CONSIGN_FEE);
    const who = pick(DW.WHALES);
    recordSale(s, car, hammer - fee, `at the VIP Invitational (to ${who})`);
    return { ok: true, msg: `SOLD to ${who} for $${fmt(hammer)}! After the ${Math.round(DW.CONSIGN_FEE * 100)}% seller’s fee you get $${fmt(hammer - fee)}.` };
  };
  DW.vipLots = s => { if (DW.vipOpen(s) && DW.isVipDay(s) && (!s.vip || s.vip.day !== s.day)) makeVip(s); return s.vip && s.vip.day === s.day ? s.vip.lots : []; };

  DW.bid = function (s, lotIndex, maxBid) {
    const lot = s.auction && s.auction.lots[lotIndex];
    if (!lot || lot.done) return { ok: false, msg: 'That lot is gone.' };
    if (DW.freeSpaces(s) < 1) return { ok: false, msg: 'No room on your lot. Sell or wholesale something first.' };
    maxBid = money(maxBid);
    if (!(maxBid >= lot.start)) return { ok: false, msg: `Bidding opens at $${fmt(lot.start)}.` };
    const inc = priceStep(lot.aiMax) * 2;
    if (maxBid <= lot.aiMax) {
      lot.done = { won: false, price: nicePrice(Math.max(lot.aiMax, maxBid + inc)) };
      return { ok: true, won: false, msg: `Outbid! Another dealer took it for $${fmt(lot.done.price)}.` };
    }
    const price = Math.max(lot.start, Math.min(maxBid, nicePrice(lot.aiMax + inc)));
    const total = price + DW.auctionFee(price);
    if (total > s.cash) return { ok: false, msg: `You'd win at $${fmt(price)} plus a $${fmt(DW.auctionFee(price))} fee, but you only have $${fmt(s.cash)}.` };
    pay(s, total);
    lot.done = { won: true, price };
    addCar(s, lot.car, total, 'auction');
    return { ok: true, won: true, price, total, msg: `SOLD to you for $${fmt(price)} (+$${fmt(DW.auctionFee(price))} fee).` };
  };

  // classifieds: private sellers; some are clueless about what they have
  const BLURBS = ['Runs great, must sell!', 'Moving overseas, need gone this week.', 'Garage kept, my grandpa’s car.', 'New tires. AC needs recharge.',
    'Minor dent, drives perfect.', 'Selling for my cousin.', 'No lowballers, I know what I have.', 'Divorce sale, make an offer.', 'Ran when parked.',
    'Clean title in hand.', 'Daily driver, a few dings.', 'Highway miles only!', 'Upgraded stereo, tinted windows.'];
  function makeAd(s, kind) {
    let car, ask;
    if (kind === 'barn') {
      car = DW.makeCar(s, { profile: 'barn', rarity: chance(0.02) ? [5] : chance(0.25) ? [4] : [3], segs: ['classic', 'sports', 'jdm', 'exotic'] });
      ask = nicePrice(DW.shownValue(s, car) * rnd(0.35, 0.65));
    } else {
      car = DW.makeCar(s, { profile: 'classified', rarity: chance(0.05) ? [3] : chance(0.25) ? [2] : [1] });
      const v = DW.shownValue(s, car);
      ask = nicePrice(v * (chance(0.22) ? rnd(0.58, 0.85) : rnd(0.85, 1.35)));
    }
    return { id: s.nextId++, car, ask, min: ask * rnd(0.78, 0.94), posted: s.day, seller: `${pick(DW.FIRST)} ${pick(DW.LAST)[0]}.`,
      blurb: kind === 'barn' ? pick(['Found this in my late uncle’s barn. No idea what it is worth.', 'Estate sale: old car under a tarp, been sitting 20 years.', 'Clearing out the shed. Old sports car, does not run.']) : pick(BLURBS),
      barn: kind === 'barn', angry: false, tries: 0 };
  }
  function refreshClassifieds(s) {
    const keep = s.classifieds ? s.classifieds.ads.filter(a => s.day - a.posted < 3) : [];
    const fresh = [];
    const n = 3 + Math.min(3, s.levels.lot) - Math.min(2, keep.length >> 1);
    for (let i = 0; i < Math.max(2, n); i++) fresh.push(makeAd(s, chance(0.03) ? 'barn' : 'normal'));
    s.classifieds = { day: s.day, ads: [...fresh, ...keep] };
  }
  DW.inspectCost = car => clamp(nicePrice(120 + DW.value(null, car) * 0.004), 150, 1500);
  function reveal(car) { if (car.issue) car.issue.known = true; if (car.salvage) car.salvageKnown = true; car.inspected = true; }
  DW.inspectAd = function (s, adId) {
    const ad = s.classifieds.ads.find(a => a.id === adId);
    if (!ad || ad.car.inspected) return { ok: false };
    const cost = DW.inspectCost(ad.car);
    if (cost > s.cash) return { ok: false, msg: 'Not enough cash for an inspection.' };
    pay(s, cost); reveal(ad.car);
    const found = [ad.car.issue && ad.car.issue.name, ad.car.salvage && 'a salvage title'].filter(Boolean);
    return { ok: true, msg: found.length ? `Inspection ($${fmt(cost)}) found: ${found.join(' and ')}.` : `Inspection ($${fmt(cost)}): it's clean. No hidden problems.` };
  };
  // make the seller an offer
  DW.offerAd = function (s, adId, offer) {
    const ad = s.classifieds.ads.find(a => a.id === adId);
    if (!ad) return { ok: false, msg: 'That ad is gone.' };
    if (ad.angry) return { ok: false, msg: `${ad.seller} stopped answering your texts.` };
    if (DW.freeSpaces(s) < 1) return { ok: false, msg: 'No room on your lot.' };
    offer = money(offer);
    if (!(offer > 0)) return { ok: false, msg: 'Make a real offer.' };
    if (offer > s.cash) return { ok: false, msg: `You only have $${fmt(s.cash)}.` };
    ad.tries++;
    if (offer >= ad.min || offer >= ad.ask) {
      const price = Math.min(offer, ad.ask);
      pay(s, price);
      s.classifieds.ads = s.classifieds.ads.filter(a => a !== ad);
      addCar(s, ad.car, price, 'classifieds');
      return { ok: true, bought: true, msg: `${ad.seller}: "Deal." You bought it for $${fmt(price)}.` };
    }
    if (offer < ad.min * 0.72 || ad.tries >= 3) {
      ad.angry = true;
      return { ok: true, msg: `${ad.seller}: "${pick(['Lol. No.', 'Lowballer. Blocked.', 'Don’t waste my time.', 'I said no lowballers!'])}"` };
    }
    ad.ask = nicePrice(Math.max(ad.min, (ad.ask + offer) / 2 + (ad.ask - offer) * 0.1));
    return { ok: true, msg: `${ad.seller}: "Best I can do is $${fmt(ad.ask)}."` };
  };

  // ---------- reconditioning ----------
  const JOBS = {
    mech:   { label: 'Mechanical repair', field: 'mech', perPt: (b) => 2.5 + b * 0.0053, out: 2, up: 'shop' },
    body:   { label: 'Body & paint', field: 'body', perPt: (b) => 2 + b * 0.004, out: 3, up: 'shop' },
    detail: { label: 'Full detail', field: 'detail', perPt: (b) => 1.2 + b * 0.0016, out: 1, up: 'detail' },
  };
  DW.JOBS = JOBS;
  DW.jobTarget = (s, kind) => (kind === 'detail' ? (s.levels.detail ? 100 : 95) : DW.level(s, 'shop').max);
  function jobInfo(s, car, kind) {
    const j = JOBS[kind], m = model(car);
    const target = DW.jobTarget(s, kind);
    const from = kind === 'mech' ? DW.apparentMech(car) : car[j.field];
    const inHouse = kind === 'detail' ? s.levels.detail > 0 : s.levels.shop > 0 && DW.shopBusy(s) < DW.level(s, 'shop').bays;
    const mult = (inHouse ? DW.level(s, j.up).costMult : 1) * (1 - 0.08 * perk(s, 'repair'));
    const cost = nicePrice(Math.max(0, target - from) * j.perPt(m.book) * mult + (kind === 'detail' ? 60 : 150));
    const days = kind === 'detail' ? (DW.level(s, 'detail').instant ? 0 : 1) : (inHouse ? DW.level(s, 'shop').days : j.out);
    return { target, from, cost, days, inHouse, worth: target > from + 1 };
  }
  DW.jobInfo = jobInfo;
  DW.jobGain = function (s, car, kind) {
    const info = jobInfo(s, car, kind), f = JOBS[kind].field, old = car[f], oldIssue = car.issue, before = DW.shownValue(s, car);
    car[f] = info.target; if (kind === 'mech') car.issue = null;
    const gain = DW.shownValue(s, car) - before;
    car[f] = old; car.issue = oldIssue;
    return { ...info, gain };
  };
  DW.shopBusy = s => s.cars.filter(c => c.job && c.job.inHouse).length;
  DW.startJob = function (s, carId, kind) {
    const car = s.cars.find(c => c.id === carId);
    if (!car || car.job) return { ok: false, msg: 'That car is busy.' };
    const info = jobInfo(s, car, kind);
    if (!info.worth) return { ok: false, msg: 'Nothing left to improve there.' };
    if (info.cost > s.cash) return { ok: false, msg: `That costs $${fmt(info.cost)}; you have $${fmt(s.cash)}.` };
    pay(s, info.cost);
    car.cost += info.cost;
    car.job = { kind, target: info.target, done: s.day + info.days, inHouse: info.inHouse };
    if (info.days === 0) return finishJob(s, car);
    return { ok: true, msg: `${JOBS[kind].label} started on the ${DW.carName(car)} ($${fmt(info.cost)}, back in ${info.days} day${info.days > 1 ? 's' : ''}).` };
  };
  function finishJob(s, car) {
    const { kind, target } = car.job;
    car.job = null;
    let extra = '';
    if (kind === 'mech') {
      // the mechanic finds whatever was hiding, and the extra work goes on the bill
      if (car.issue && !car.issue.known) {
        const add = nicePrice(car.issue.dmg * JOBS.mech.perPt(model(car).book) * DW.level(s, 'shop').costMult);
        pay(s, add); car.cost += add;
        extra = ` The mechanic found a ${car.issue.name.toLowerCase()}: +$${fmt(add)} on the bill.`;
      }
      car.issue = null; car.inspected = true; car.mech = Math.max(car.mech, target);
    } else car[JOBS[kind].field] = Math.max(car[JOBS[kind].field], target);
    if (car.reprice) { car.ask = DW.listPrice(s, car); delete car.reprice; }
    const msg = `${JOBS[kind].label} done on the ${DW.carName(car)}.${extra}`;
    DW.note(s, msg, extra ? 'bad' : 'good');
    return { ok: true, msg, done: true };
  }
  DW.inspectCar = function (s, carId) {
    const car = s.cars.find(c => c.id === carId);
    if (!car || car.inspected) return { ok: false };
    const cost = Math.round(DW.inspectCost(car) * (s.levels.shop ? 0.4 : 1));
    if (cost > s.cash) return { ok: false, msg: 'Not enough cash.' };
    pay(s, cost); car.cost += cost; reveal(car);
    return { ok: true, msg: car.issue ? `Inspection ($${fmt(cost)}) found a ${car.issue.name.toLowerCase()}.` : `Inspection ($${fmt(cost)}): no hidden problems.` };
  };

  // ---------- selling ----------
  function recordSale(s, car, price, how) {
    const profit = price - car.cost;
    s.cash = money(s.cash + price);
    s.cars = s.cars.filter(c => c !== car);
    s.earned = money(s.earned + profit); s.runEarned = money(s.runEarned + profit);
    s.revenue = money(s.revenue + price);
    s.carsSold++; s.runSold++;
    s.today.sold++; s.today.revenue += price; s.today.profit += profit;
    if (price > s.best.sale) s.best.sale = price;
    if (profit > s.best.flip) s.best.flip = profit;
    if (model(car).rarity === 5) s.stats.mythicSold++;
    // a lemon sold without fixing comes back to bite
    const lemon = car.issue && !car.issue.known;
    if (lemon && chance(0.6)) s.complaints.push({ name: DW.carName(car), issue: car.issue.name, due: s.day + ri(1, 6), refund: money(price * rnd(0.12, 0.25)) });
    // happy customers talk: more for a car in great shape, more again for a certified one
    let gain = 0.15;
    if (!lemon && DW.condition(car, false) > 75) gain += 0.2;
    if (DW.isCpo(s, car)) gain += 0.5;
    addRep(s, gain);
    DW.note(s, `Sold the ${DW.carName(car)} ${how} for $${fmt(price)} (${profit >= 0 ? 'profit' : 'loss'} $${fmt(Math.abs(profit))}).`, profit >= 0 ? 'money' : 'bad');
    return profit;
  }
  DW.wholesaleOffer = (s, car) => nicePrice(DW.value(s, car) * 0.7);
  DW.wholesale = function (s, carId) {
    const car = s.cars.find(c => c.id === carId);
    if (!car || car.job) return { ok: false, msg: 'That car is in the shop.' };
    s.today = s.today || newToday();
    const price = DW.wholesaleOffer(s, car);
    const profit = recordSale(s, car, price, 'to the wholesaler');
    return { ok: true, msg: `Wholesaled for $${fmt(price)} (${profit >= 0 ? '+' : '-'}$${fmt(Math.abs(profit))}).` };
  };
  // client requests: someone wants one particular model and pays over value for it
  DW.requestPrice = (s, car, r) => nicePrice(DW.shownValue(s, car) * r.mult);
  DW.sellToRequest = function (s, carId, reqId) {
    const car = s.cars.find(c => c.id === carId);
    const r = s.requests.find(x => x.id === reqId);
    if (!car || !r || car.mid !== r.mid || car.job) return { ok: false };
    s.today = s.today || newToday();
    const price = DW.requestPrice(s, car, r);
    recordSale(s, car, price, `to ${r.who}`);
    s.requests = s.requests.filter(x => x !== r);
    s.stats.requests++;
    addRep(s, r.rep || 4);
    return { ok: true, msg: `${r.who} drove off happy. $${fmt(price)}!` };
  };

  // ---------- a business day ----------
  const newToday = () => ({ sold: 0, revenue: 0, profit: 0, visitors: 0, walked: 0, unserved: 0, repStart: null, unservedPenalty: 0 });
  DW.PER_SALESMAN = 4; // customers one salesman can look after in a day
  DW.traffic = s => {
    let t = 2.2 + DW.level(s, 'showroom').traffic + DW.level(s, 'billboard').traffic + s.rep / 22 + Math.sqrt(DW.spaces(s)) * 0.35;
    for (const a of s.ads) t += (DW.ADS.find(x => x.id === a.id) || {}).traffic || 0;
    for (const e of s.effects) if (e.traffic) t *= e.traffic;
    return t;
  };
  const SEG_WEIGHT = { economy: 26, family: 18, suv: 16, truck: 14, luxury: 10, sports: 9, classic: 3, jdm: 2, exotic: 2 };
  // who walks onto the lot today (decided as they arrive, so the lot can change between visitors)
  DW.planDay = function (s) {
    s.today = newToday();
    s.today.repStart = s.rep;
    const n = poisson(DW.traffic(s));
    const premium = DW.level(s, 'showroom').premium;
    const people = [];
    for (let i = 0; i < n; i++) {
      // whales: eight-figure collectors who only come to dealers with a name
      if (DW.vipOpen(s) && chance((0.025 + premium * 0.15) * (1 + 0.6 * perk(s, 'whale')))) {
        people.push({ name: `${pick(DW.FIRST)} ${pick(DW.LAST)}`, budget: money(Math.exp(rnd(Math.log(1.5e6), Math.log(1.6e8)))), seg: null, collector: true, whale: true, finance: false });
        continue;
      }
      const collector = chance(0.03 + premium * 0.6 + s.rep / 2500);
      const wealthy = !collector && chance(0.1 + premium);
      const budget = collector ? Math.exp(rnd(Math.log(60000), Math.log(8000000))) : wealthy ? Math.exp(rnd(Math.log(25000), Math.log(160000))) : Math.exp(rnd(Math.log(1800), Math.log(42000)));
      const seg = collector ? null : chance(0.45) ? null : weighted(Object.keys(SEG_WEIGHT), k => SEG_WEIGHT[k] * (['luxury', 'sports', 'exotic'].includes(k) ? 1 + premium * 8 : 1));
      people.push({ name: `${pick(DW.FIRST)} ${pick(DW.LAST)}`, budget: money(budget * (1 + DW.level(s, 'finance').buyers)), seg, collector, finance: s.levels.finance > 0 && chance(0.5) });
    }
    return people;
  };
  // how much this person would really pay for this car
  DW.willingness = (s, car, person, rep) => {
    const m = model(car);
    let w = DW.shownValue(s, car) * person.mood;
    w *= 0.92 + (rep == null ? s.rep : rep) * 0.0016;
    if (['luxury', 'sports', 'exotic', 'jdm', 'classic'].includes(m.seg)) w *= 1 + DW.level(s, 'showroom').premium;
    if (person.finance) w *= 1 + DW.level(s, 'finance').markup;
    if (person.collector && m.collectible) w *= 1.1;
    if (DW.isCpo(s, car)) w *= 1.06;
    w *= 1 + 0.02 * perk(s, 'tongue');
    return w;
  };
  // one visitor arrives: returns what happened (and, for offers, what the player has to decide)
  DW.visit = function (s, person, servedSoFar) {
    s.today.visitors++;
    const salesmen = s.staff.length;
    // collectors and whales never wait in line: the owner looks after them personally
    const vip = person.collector || person.whale;
    if (!vip && servedSoFar >= salesmen * DW.PER_SALESMAN) {
      s.today.unserved++;
      if (s.today.unservedPenalty < 1.5) { s.today.unservedPenalty += 0.1; addRep(s, -0.1); } // annoying, but it caps out
      return { kind: 'unserved', text: pick(['Hello? Anybody work here?', 'Nobody to help me. I’m out.', 'I waited 20 minutes!']) }; }
    const salesman = vip ? s.staff.reduce((a, b) => (b.skill > a.skill ? b : a)) : s.staff[servedSoFar % salesmen];
    person.mood = rnd(0.9, 1.12) * (1 + (salesman.skill - 1) * 0.022);
    let options = s.cars.filter(c => !c.job && c.ask > 0 && c.ask <= person.budget * 1.05);
    if (person.whale) options = options.filter(c => model(c).rarity >= 4);
    else if (person.collector) options = options.filter(c => model(c).collectible || model(c).rarity >= 3);
    else if (person.seg) options = options.filter(c => model(c).seg === person.seg);
    if (!options.length) { s.today.walked++; return { kind: 'nothing', vip, text: person.collector ? 'Nothing here worth collecting.' : person.seg ? `No ${DW.SEGMENTS[person.seg].toLowerCase()} cars I can afford.` : 'Nothing in my price range.' }; }
    // they go for the car that looks like the best deal, with a bit of taste thrown in
    const car = weighted(options, c => Math.pow(DW.shownValue(s, c) / c.ask, 4) * rnd(0.5, 1.5) * (1 + DW.condition(c, true) / 100));
    const w = DW.willingness(s, car, person);
    const sm = { name: salesman.name, id: salesman.id };
    if (car.ask <= w) return { kind: 'buy', car, price: car.ask, salesman: sm, trade: maybeTrade(s, person), vip };
    if (car.ask <= w * 1.15) return { kind: 'offer', car, offer: nicePrice(w * rnd(0.9, 0.99)), w, salesman: sm, trade: maybeTrade(s, person), vip };
    s.today.walked++;
    return { kind: 'walk', car, vip, text: pick(['Way too much for that.', 'Ha! For THAT?', 'I can get one cheaper online.', 'That price is a joke.']) };
  };
  function maybeTrade(s, person) {
    if (!chance(0.22)) return null;
    const car = DW.makeCar(s, { profile: 'trade', rarity: [1, 2], maxBook: Math.max(4000, person.budget * 0.8) });
    return { car, credit: nicePrice(DW.shownValue(s, car) * rnd(0.62, 0.86)) };
  }
  // the player's answer to a counter-offer: true if the buyer takes it
  DW.counter = (s, v, amount) => amount <= v.w || (amount <= v.w * 1.05 && chance(0.45));
  // close a sale (from a visit); trade = accepted trade-in or null
  DW.closeSale = function (s, v, price, takeTrade) {
    const car = v.car;
    if (!s.cars.includes(car)) return { ok: false };
    const st = s.staff.find(p => p.id === v.salesman.id);
    if (st) { st.sold++; if (st.sold % 15 === 0 && st.skill < 5) { st.skill++; DW.note(s, `${st.name} is getting good at this (skill ${st.skill}).`, 'good'); } }
    let profit = recordSale(s, car, price, `to a customer`);
    if (takeTrade && v.trade && DW.freeSpaces(s) >= 1) {
      s.cash = money(s.cash - v.trade.credit);
      addCar(s, v.trade.car, v.trade.credit, 'trade-in');
    }
    return { ok: true, profit };
  };

  // ---------- staff, upgrades, ads, money ----------
  // who's looking for work: refreshed every 3 days; the better your name, the better the applicants
  function candidate(s, minSkill) {
    const lean = s.rep / 30 + s.levels.showroom * 0.3;
    const skill = weighted([1, 2, 3, 4, 5].filter(k => k >= (minSkill || 1)), k => [5, 6, 4, 2, 1][k - 1] * Math.exp((k - 3) * lean * 0.3));
    const taken = new Set([...s.staff, ...((s.hirePool && s.hirePool.people) || [])].map(p => p.name));
    let name; do name = `${pick(DW.FIRST)} ${pick(DW.LAST)}`; while (taken.has(name));
    return { id: s.nextId++, name, skill, wage: 100 + skill * 45 + ri(-10, 10), sold: 0, trained: 0 };
  }
  function refreshHires(s, minSkill) {
    s.hirePool = { day: s.day, people: [] };
    for (let i = 0; i < 3 + Math.min(3, s.levels.showroom); i++) s.hirePool.people.push(candidate(s, minSkill));
    s.hireDay = s.day + 3;
  }
  DW.headhunterFee = s => 4000 + 4000 * s.levels.showroom;
  DW.headhunter = function (s) {
    const fee = DW.headhunterFee(s);
    if (fee > s.cash) return { ok: false, msg: `The headhunter wants $${fmt(fee)}.` };
    pay(s, fee); refreshHires(s, 3);
    return { ok: true, msg: 'The headhunter sent over a fresh list: 3 stars and up only.' };
  };
  DW.trainCost = p => 3000 * p.skill * p.skill;
  DW.train = function (s, id) {
    const p = s.staff.find(x => x.id === id);
    if (!p || p.skill >= 5) return { ok: false, msg: 'Already a top seller.' };
    if (s.day - p.trained < 7) return { ok: false, msg: `${p.name} just got back from training. Try again on day ${p.trained + 7}.` };
    const cost = DW.trainCost(p);
    if (cost > s.cash) return { ok: false, msg: `Sales training costs $${fmt(cost)}.` };
    pay(s, cost); p.skill++; p.wage += 45; p.trained = s.day;
    return { ok: true, msg: `${p.name} came back from sales seminar with a new tie and ${p.skill} stars.` };
  };
  DW.hireFee = p => p.wage * 5;
  DW.hire = function (s, id) {
    const p = s.hirePool.people.find(x => x.id === id);
    if (!p) return { ok: false };
    if (s.staff.length >= DW.maxStaff(s)) return { ok: false, msg: 'No desk for another salesman. Upgrade your lot or showroom.' };
    if (DW.hireFee(p) > s.cash) return { ok: false, msg: 'Not enough cash for the signing bonus.' };
    pay(s, DW.hireFee(p));
    s.staff.push(p); s.hirePool.people = s.hirePool.people.filter(x => x !== p);
    DW.note(s, `Hired ${p.name} (skill ${p.skill}).`, 'good');
    return { ok: true, msg: `${p.name} starts today.` };
  };
  DW.fire = function (s, id) {
    if (s.staff.length <= 1) return { ok: false, msg: 'You need at least one salesman.' };
    const p = s.staff.find(x => x.id === id);
    s.staff = s.staff.filter(x => x !== p);
    pay(s, p.wage * 3);
    DW.note(s, `Let ${p.name} go (3 days’ severance).`);
    return { ok: true, msg: `${p.name} cleaned out their desk.` };
  };
  DW.upgrade = function (s, key) {
    const u = DW.UPGRADES[key], next = u.levels[s.levels[key] + 1];
    if (!next) return { ok: false, msg: 'Already maxed out.' };
    if (next.cost > s.cash) return { ok: false, msg: `That costs $${fmt(next.cost)}.` };
    pay(s, next.cost);
    s.levels[key]++;
    s.rep = clamp(s.rep + 2, 0, 100);
    DW.note(s, `Upgraded: ${next.name}!`, 'good');
    return { ok: true, msg: `${next.name} is open for business.` };
  };
  DW.runAd = function (s, id) {
    const ad = DW.ADS.find(a => a.id === id);
    if (s.ads.some(a => a.id === id)) return { ok: false, msg: 'That campaign is already running.' };
    if (ad.cost > s.cash) return { ok: false, msg: `That costs $${fmt(ad.cost)}.` };
    pay(s, ad.cost);
    s.ads.push({ id, until: s.day + ad.days });
    if (ad.rep) s.rep = clamp(s.rep + ad.rep, 0, 100);
    return { ok: true, msg: `${ad.name} running for ${ad.days} days.` };
  };
  DW.borrow = function (s, who, amount) {
    amount = money(amount);
    if (!(amount > 0)) return { ok: false };
    if (who === 'bank') {
      const room = DW.bankLimit(s) - s.bank;
      if (amount > room) return { ok: false, msg: room > 0 ? `The bank will only lend you $${fmt(room)} more.` : 'The bank says no. Have you considered… other lenders?' };
      s.bank += amount; s.cash += amount;
      return { ok: true, msg: `Borrowed $${fmt(amount)} from First National.` };
    }
    const room = DW.sharkLimit(s) - s.shark;
    if (amount > room) return { ok: false, msg: `Big Tony: "I can do $${fmt(room)}. Don’t get greedy."` };
    if (!s.shark) s.sharkDue = s.day + SHARK_DAYS;
    s.shark += amount; s.cash += amount;
    return { ok: true, msg: `Big Tony counts out $${fmt(amount)} in cash. "${SHARK_DAYS} days. Don’t make me come find you."` };
  };
  DW.repay = function (s, who, amount) {
    const owed = who === 'bank' ? s.bank : s.shark;
    amount = money(Math.min(amount, owed, s.cash));
    if (!(amount > 0)) return { ok: false, msg: 'Nothing to pay.' };
    pay(s, amount);
    if (who === 'bank') s.bank -= amount; else { s.shark -= amount; if (!s.shark) { s.sharkDue = 0; s.stats.tonyPaid++; } }
    return { ok: true, msg: who === 'bank' ? `Paid $${fmt(amount)} to the bank.` : s.shark ? `Paid Big Tony $${fmt(amount)}.` : 'Big Tony: "Pleasure doing business."' };
  };

  // ---------- the night: bills, interest, the market, and whatever else happens ----------
  // prices drift a little every night (pulled back toward normal), plus whatever events are pushing them
  function refreshMarkets(s, firstDay) {
    for (const k of Object.keys(s.market)) {
      let m = s.market[k];
      m += (1 - m) * 0.08 + rnd(-0.018, 0.018);
      for (const e of s.effects) if (e.seg === k || e.seg === 'all') m *= e.daily || 1;
      s.market[k] = clamp(m, 0.7, 1.4);
    }
    if (firstDay) { makeAuction(s); refreshClassifieds(s); refreshHires(s); }
  }
  const EVENTS = [
    { w: 3, run: s => segEvent(s, pick(['truck', 'suv']), 0.97, 'Gas prices spike! Truck and SUV buyers are scarce.') },
    { w: 3, run: s => segEvent(s, 'economy', 1.03, 'Gas prices spike! Everybody wants something that sips fuel.') },
    { w: 2, run: s => segEvent(s, 'classic', 1.035, 'The big classic car show is in town. Classic values are climbing.') },
    { w: 2, run: s => segEvent(s, pick(['sports', 'jdm']), 1.03, 'A street-racing movie is #1 at the box office. Sports cars are hot.') },
    { w: 2, run: s => segEvent(s, 'all', 1.015, 'Chip shortage! New cars are back-ordered and used prices are rising.') },
    { w: 2, run: s => segEvent(s, 'luxury', 0.975, 'Stock market wobble. Luxury buyers are nervous.') },
    { w: 3, run: s => { s.effects.push({ traffic: 1.5, until: s.day + 5 }); return { text: 'Tax refund season! Buyers everywhere this week.', kind: 'good' }; } },
    { w: 2, run: s => { s.effects.push({ traffic: 0.65, until: s.day + 3 }); return { text: 'Three days of rain. Nobody wants to walk a car lot.', kind: 'bad' }; } },
    { w: 2, run: s => hail(s) },
    { w: 1, run: s => theft(s) },
    { w: 2, run: s => { const c = s.cars.filter(x => !x.job); if (!c.length) return null; const car = pick(c); car.detail = clamp(car.detail - ri(25, 45), 0, 100); car.body = clamp(car.body - ri(0, 8), 0, 100); return { text: `Vandals keyed and egged the ${DW.carName(car)} overnight.`, kind: 'bad' }; } },
    { w: 2, run: s => { s.classifieds.ads.unshift(makeAd(s, 'barn')); return { text: 'A tip from a buddy: someone’s selling an old car out of a barn. Check the classifieds!', kind: 'good' }; } },
    { w: 2, run: s => celebrity(s) },
    { w: 2, run: s => { s.rep = clamp(s.rep + 4, 0, 100); return { text: 'The local paper ran a nice story about your dealership. Reputation up!', kind: 'good' }; } },
    { w: 1, run: s => { if (s.staff.length < 2) return null; const p = pick(s.staff); s.staff = s.staff.filter(x => x !== p); return { text: `${p.name} quit to go sell boats. Hire someone new in the Staff tab.`, kind: 'bad' }; } },
    { w: 1, run: s => { const fine = nicePrice(clamp(s.cash * 0.04, 500, 25000)); pay(s, fine); return { text: `Surprise! A county inspector fined you $${fmt(fine)} for "improper signage".`, kind: 'bad' }; } },
  ];
  function segEvent(s, seg, daily, text) { s.effects.push({ seg, daily, until: s.day + ri(4, 7) }); return { text, kind: daily > 1 ? 'good' : 'bad' }; }
  function hail(s) {
    const cars = s.cars.filter(c => !c.job);
    if (!cars.length) return null;
    if (s.levels.insurance) return { text: 'A hailstorm rolled through, but your insurance covered the damage.', kind: 'good' };
    for (const c of cars) c.body = clamp(c.body - ri(8, 25), 0, 100);
    return { text: `HAILSTORM! Every car on the lot got dinged. ${cars.length} cars need body work.`, kind: 'bad' };
  }
  function theft(s) {
    const cars = s.cars.filter(c => !c.job);
    if (!cars.length) return null;
    const car = weighted(cars, c => DW.value(s, c));
    s.cars = s.cars.filter(c => c !== car);
    if (s.levels.insurance) { const pay80 = nicePrice(DW.value(s, car) * 0.8); s.cash += pay80; return { text: `Thieves stole the ${DW.carName(car)}! Insurance paid $${fmt(pay80)}.`, kind: 'bad' }; }
    return { text: `Thieves stole the ${DW.carName(car)} off the lot! No insurance… it’s gone.`, kind: 'bad' };
  }
  // a client asks for one particular model: up to 3 open at a time
  const CLIENTS = ['rapper Lil Lugnut', 'NBA star Dunk Daniels', 'YouTuber CarGuyChris', 'country singer Hank Hollis', 'a Saudi prince', 'a crypto millionaire',
    'movie director Ron Spielman', 'Dr. Patel the dentist', 'a nervous groom', 'Coach Barnes', 'Grandma Rosa', 'a film studio prop department', 'pop star Kayla K', 'a private museum'];
  function celebrity(s) {
    if (s.requests.length >= 3) return null;
    const rare = DW.vipOpen(s) && chance(0.2) ? [4, 5] : chance(0.5) ? [3, 4] : [2, 3];
    const m = pick(DW.MODELS.filter(x => rare.includes(x.rarity)));
    const who = pick(CLIENTS), days = ri(8, 14);
    const r = { id: s.nextId++, mid: m.id, who: who[0].toUpperCase() + who.slice(1), mult: rnd(1.25, 1.6), until: s.day + days, rep: m.rarity >= 4 ? 6 : 4 };
    s.requests.push(r);
    return { text: `${r.who} wants a ${m.make} ${m.model} and will pay ${Math.round((r.mult - 1) * 100)}% over value. You have ${days} days.`, kind: 'good' };
  }
  // the Concours d'Elegance, every Friday: enter a rare car in great shape
  DW.CONCOURS_FEE = 2500;
  DW.concoursOk = (s, car) => model(car).rarity >= 3 && DW.condition(car, false) >= 85 && !car.job && !car.award;
  DW.enterConcours = function (s, carId) {
    const car = s.cars.find(c => c.id === carId);
    if (!car || !DW.concoursOk(s, car)) return { ok: false, msg: 'Only rare cars in 85+ condition can enter.' };
    if (s.concours) return { ok: false, msg: 'You already have a car entered this week.' };
    if (DW.CONCOURS_FEE > s.cash) return { ok: false, msg: 'Not enough for the entry fee.' };
    pay(s, DW.CONCOURS_FEE);
    s.concours = { carId, day: s.day + ((5 - (s.day % 7) + 7) % 7) };
    return { ok: true, msg: `Entered! Judging is on day ${s.concours.day} (Friday). Don\u2019t sell it before then.` };
  };
  function judgeConcours(s) {
    const entry = s.concours, car = s.cars.find(c => c.id === entry.carId);
    s.concours = null;
    if (!car) return { text: 'Your concours car wasn\u2019t there on judging day. Entry fee lost.', kind: 'bad' };
    const score = DW.condition(car, false) * 0.6 + model(car).rarity * 8 + rnd(0, 25);
    const v = DW.value(s, car), prize = money(Math.max(25000, v * 0.04));
    if (score >= 100) { car.award = true; s.cash += prize; s.stats.concoursWins++; addRep(s, 6); return { text: `\u{1F3C6} BEST IN SHOW! Your ${DW.carName(car)} won the Concours d\u2019Elegance: $${fmt(prize)} prize, a big reputation boost, and it\u2019s now worth 8% more as an award winner.`, kind: 'good' }; }
    if (score >= 90) { s.cash += money(prize * 0.4); addRep(s, 3); return { text: `\u{1F948} Your ${DW.carName(car)} took 2nd place at the Concours: $${fmt(prize * 0.4)} and some good press.`, kind: 'good' }; }
    if (score >= 80) { s.cash += money(prize * 0.15); addRep(s, 1); return { text: `\u{1F949} 3rd place at the Concours for your ${DW.carName(car)}: $${fmt(prize * 0.15)}.`, kind: 'good' }; }
    return { text: `The judges barely looked at your ${DW.carName(car)}. No ribbon this week.`, kind: '' };
  }

  // ---------- empire: branches, trophies ----------
  DW.buyBranch = function (s, id) {
    const b = DW.BRANCHES.find(x => x.id === id);
    if (!b || s.branches.includes(id)) return { ok: false };
    if (s.rep < b.rep) return { ok: false, msg: `The landlord wants a dealer with ${b.rep}+ reputation.` };
    if (b.cost > s.cash) return { ok: false, msg: `That location costs $${fmt(b.cost)}.` };
    pay(s, b.cost); s.branches.push(id); addRep(s, 3);
    DW.note(s, `Opened ${b.name}!`, 'good');
    return { ok: true, msg: `${b.name} is open. It\u2019ll send you about $${fmt(DW.branchIncome(s, b))} a night.` };
  };
  DW.checkTrophies = function (s) {
    const got = [];
    for (const t of DW.TROPHIES) if (!s.trophies[t.id] && t.test(s)) { s.trophies[t.id] = s.day; addRep(s, 2); got.push(t); DW.note(s, `\u{1F3C6} Trophy: ${t.name} (${t.desc})`, 'good'); }
    return got;
  };

  // ---------- the museum ----------
  DW.museumSlots = s => DW.MUSEUM[s.museum.level].slots;
  DW.setDone = (s, set) => set.mids.every(mid => s.museum.cars.some(c => c.mid === mid));
  DW.setsDone = s => DW.SETS.filter(x => DW.setDone(s, x)).length;
  // ticket money every night: a sliver of what's on display, more for complete sets and a good name
  DW.museumIncome = s => money(DW.museumValue(s) * 0.0005 * (1 + 0.25 * DW.setsDone(s)) * (0.6 + s.rep * 0.006));
  DW.buildMuseum = function (s) {
    const next = DW.MUSEUM[s.museum.level + 1];
    if (!next) return { ok: false, msg: 'Your museum is as grand as it gets.' };
    if (next.cost > s.cash) return { ok: false, msg: `That costs $${fmt(next.cost)}.` };
    pay(s, next.cost); s.museum.level++; addRep(s, 3);
    DW.note(s, `Opened the ${next.name}!`, 'good');
    return { ok: true, msg: `The ${next.name} is open: room for ${next.slots} cars.` };
  };
  DW.toMuseum = function (s, carId) {
    const car = s.cars.find(c => c.id === carId);
    if (!car || car.job) return { ok: false, msg: 'That car is busy.' };
    if (s.museum.cars.length >= DW.museumSlots(s)) return { ok: false, msg: s.museum.level ? 'The museum is full. Expand it or take a car out.' : 'Build a museum first (Empire tab).' };
    s.cars = s.cars.filter(c => c !== car);
    car.job = null; car.museumSince = s.day;
    s.museum.cars.push(car);
    if (s.concours && s.concours.carId === car.id) s.concours = null;
    const done = DW.SETS.filter(x => DW.setDone(s, x) && x.mids.includes(car.mid));
    for (const set of done) DW.note(s, `\u{1F3DB}️ Museum set complete: ${set.name}!`, 'good');
    return { ok: true, msg: `The ${DW.carName(car)} is on display.${done.length ? ` Set complete: ${done.map(x => x.name).join(', ')}!` : ''}` };
  };
  DW.fromMuseum = function (s, carId) {
    const car = s.museum.cars.find(c => c.id === carId);
    if (!car) return { ok: false };
    if (DW.freeSpaces(s) < 1) return { ok: false, msg: 'No room on your lot.' };
    s.museum.cars = s.museum.cars.filter(c => c !== car);
    car.bought = s.day; delete car.museumSince;
    car.ask = DW.listPrice(s, car);
    s.cars.push(car);
    return { ok: true, msg: `The ${DW.carName(car)} is back on the lot, priced at $${fmt(car.ask)}.` };
  };

  // ---------- fleet contracts ----------
  function makeContract(s) {
    const k = pick(DW.CONTRACT_KINDS);
    return { id: s.nextId++, who: k.who, what: k.what, segs: k.segs, minCond: k.minCond, count: ri(...k.count), delivered: 0, paid: 0,
      mult: rnd(1.12, 1.3), until: s.day + ri(7, 12) };
  }
  DW.contractCars = (s, c) => s.cars.filter(car => !car.job && c.segs.includes(model(car).seg) && model(car).rarity <= 3 && DW.condition(car, false) >= c.minCond)
    .sort((a, b) => DW.value(s, a) - DW.value(s, b));
  DW.deliverContract = function (s, id) {
    const c = s.contracts.find(x => x.id === id);
    if (!c) return { ok: false };
    const cars = DW.contractCars(s, c).slice(0, c.count - c.delivered);
    if (!cars.length) return { ok: false, msg: `Nothing on your lot fits: ${c.what}, ${c.minCond}+ condition.` };
    s.today = s.today || newToday();
    let total = 0;
    for (const car of cars) { const price = nicePrice(DW.value(s, car) * c.mult); recordSale(s, car, price, `to ${c.who}`); total += price; }
    c.delivered += cars.length; c.paid += total;
    if (c.delivered >= c.count) {
      const bonus = money(c.paid * 0.15);
      s.cash += bonus; s.earned = money(s.earned + bonus); s.runEarned = money(s.runEarned + bonus);
      s.contracts = s.contracts.filter(x => x !== c); s.stats.contracts++; addRep(s, 3);
      return { ok: true, msg: `Contract complete! ${cars.length} car${cars.length > 1 ? 's' : ''} for $${fmt(total)}, plus a $${fmt(bonus)} completion bonus from ${c.who}.` };
    }
    return { ok: true, msg: `Delivered ${cars.length} car${cars.length > 1 ? 's' : ''} for $${fmt(total)}. ${c.count - c.delivered} more to go.` };
  };

  // ---------- prestige: sell the company, keep the museum, start over stronger ----------
  // stars come from what you sell off: the museum, which you keep, doesn't count
  DW.companyValue = s => DW.netWorth(s) - money(DW.museumValue(s) * 0.85);
  DW.prestigeGain = s => Math.floor(Math.sqrt(Math.max(0, DW.companyValue(s)) / 1e7));
  DW.sellCompany = function (s) {
    const gain = DW.prestigeGain(s);
    if (gain < 1) return { ok: false, msg: 'Buyers only bite once you’re worth $10,000,000.' };
    const carry = DW.carryOver(s);
    carry.prestige = { ...s.prestige, perks: { ...s.prestige.perks }, stars: s.prestige.stars + gain, count: s.prestige.count + 1, total: (s.prestige.total || 0) + gain };
    const fresh = DW.newGame(s.name, carry);
    DW.note(fresh, `You sold your last company for ${gain} prestige star${gain > 1 ? 's' : ''}. Spend them in Empire → Prestige.`, 'good');
    DW.checkTrophies(fresh);
    return { ok: true, state: fresh, gain };
  };
  DW.buyPerk = function (s, id) {
    const p = DW.PERKS.find(x => x.id === id), lvl = perk(s, id);
    if (!p || lvl >= p.max) return { ok: false, msg: 'Maxed out.' };
    if (s.prestige.stars < p.cost) return { ok: false, msg: `That takes ${p.cost} star${p.cost > 1 ? 's' : ''}.` };
    s.prestige.stars -= p.cost; s.prestige.perks[id] = lvl + 1;
    if (id === 'lot' && s.levels.lot < lvl + 1) s.levels.lot = lvl + 1; // takes effect right away too
    return { ok: true, msg: `${p.name} is now level ${lvl + 1}.` };
  };

  // ---------- bulk actions for a big lot ----------
  // what a bulk action would do: [{ car, kind, cost, gain }]
  DW.bulkPlan = function (s, what) {
    const plan = [];
    for (const car of s.cars) {
      if (car.job) continue;
      if (what === 'inspect') { if (!car.inspected) plan.push({ car, kind: 'inspect', cost: Math.round(DW.inspectCost(car) * (s.levels.shop ? 0.4 : 1)), gain: 0 }); continue; }
      const kinds = what === 'smart' ? ['detail', 'mech', 'body'] : [what];
      for (const kind of kinds) {
        const g = DW.jobGain(s, car, kind);
        if (!g.worth) continue;
        if (what === 'smart' && g.gain < g.cost * 1.1) continue; // smart: only what pays for itself
        plan.push({ car, kind, cost: g.cost, gain: g.gain, days: g.days });
        if (what === 'smart' && g.days > 0) break; // the car goes out for this one; anything else waits
      }
    }
    return plan;
  };
  DW.bulkRun = function (s, what) {
    let n = 0, spent = 0, skipped = 0;
    for (const p of DW.bulkPlan(s, what)) {
      if (p.car.job) { skipped++; continue; }
      const before = s.cash;
      if (p.kind !== 'inspect') p.car.reprice = true; // re-priced when the work is done, so a fixed-up car isn't sold at its old price
      const r = p.kind === 'inspect' ? DW.inspectCar(s, p.car.id) : DW.startJob(s, p.car.id, p.kind);
      if (!(r && r.ok)) delete p.car.reprice;
      if (r && r.ok) { n++; spent += before - s.cash; } else skipped++;
    }
    return { ok: n > 0, msg: n ? `${n} job${n > 1 ? 's' : ''} done or started for $${fmt(spent)}. Fixed cars are re-priced to match.${skipped ? ` ${skipped} skipped (cash or the car was busy).` : ''}` : 'Nothing to do (or not enough cash).' };
  };
  DW.bulkPrice = function (s, pct) {
    let n = 0;
    for (const car of s.cars) { if (car.job) continue; car.ask = pct ? nicePrice(DW.shownValue(s, car) * pct) : DW.suggestPrice(s, car); n++; }
    return { ok: true, msg: `Repriced ${n} car${n === 1 ? '' : 's'}.` };
  };
  DW.staleCars = (s, days) => s.cars.filter(c => !c.job && s.day - c.bought >= days);
  DW.bulkWholesale = function (s, days) {
    const cars = DW.staleCars(s, days);
    let total = 0;
    for (const c of cars) { const price = DW.wholesaleOffer(s, c); DW.wholesale(s, c.id); total += price; }
    return { ok: cars.length > 0, msg: cars.length ? `Wholesaled ${cars.length} car${cars.length > 1 ? 's' : ''} for $${fmt(total)}.` : `No cars have sat ${days}+ days.` };
  };

  DW.endDay = function (s) {
    const report = { day: s.day, today: s.today || newToday(), lines: [], events: [], trophies: [] };
    const repStart = report.today.repStart == null ? s.rep : report.today.repStart;
    const bills = DW.overhead(s);
    pay(s, bills);
    report.lines.push(['Rent, upkeep & wages', -bills]);
    // branches send their cut (it counts as money earned)
    if (s.branches.length) {
      let cut = 0;
      for (const id of s.branches) cut += money(DW.branchIncome(s, DW.BRANCHES.find(b => b.id === id)) * rnd(0.85, 1.15));
      s.cash += cut; s.earned = money(s.earned + cut); s.runEarned = money(s.runEarned + cut); s.stats.branchIncome += cut;
      report.lines.push([`Branch dealerships (${s.branches.length})`, cut]);
    }
    if (s.museum.cars.length) {
      const tickets = DW.museumIncome(s);
      s.cash += tickets; s.earned = money(s.earned + tickets); s.runEarned = money(s.runEarned + tickets); s.stats.museumIncome += tickets;
      report.lines.push([`Museum tickets (${s.museum.cars.length} car${s.museum.cars.length > 1 ? 's' : ''})`, tickets]);
    }
    // a nice showroom keeps people talking
    if (s.levels.showroom) addRep(s, 0.05 * s.levels.showroom);
    // the Concours d'Elegance is judged on Friday nights
    if (s.concours && s.concours.day <= s.day) report.events.push(judgeConcours(s));
    const bankInt = money(s.bank * BANK_RATE), sharkInt = money(s.shark * SHARK_RATE);
    s.bank += bankInt; s.shark += sharkInt;
    if (bankInt) report.lines.push(['Bank interest (added to the loan)', -bankInt]);
    if (sharkInt) report.lines.push(['Big Tony’s "interest"', -sharkInt]);
    s.day++;
    // cars come back from the shop
    for (const c of s.cars) if (c.job && c.job.done <= s.day) { const r = finishJob(s, c); report.events.push({ text: r.msg, kind: r.msg.includes('found') ? 'bad' : 'good' }); }
    // lemons come home
    for (const c of s.complaints.filter(x => x.due <= s.day)) {
      pay(s, c.refund); addRep(s, -3);
      report.events.push({ text: `The buyer of the ${c.name} is back: ${c.issue.toLowerCase()}! You paid $${fmt(c.refund)} to make it right, and your reputation took a hit.`, kind: 'bad' });
    }
    s.complaints = s.complaints.filter(x => x.due > s.day);
    // Big Tony
    if (s.shark && s.day > s.sharkDue) {
      const car = s.cars.length ? s.cars.reduce((a, b) => (DW.value(s, a) > DW.value(s, b) ? a : b)) : null;
      if (car) { s.cars = s.cars.filter(c => c !== car); const credit = nicePrice(DW.value(s, car) * 0.5); s.shark = Math.max(0, s.shark - credit); report.events.push({ text: `Big Tony’s guys towed away your ${DW.carName(car)} as "partial payment" ($${fmt(credit)} off your debt).`, kind: 'bad' }); }
      else { s.rep = clamp(s.rep - 10, 0, 100); report.events.push({ text: 'Big Tony’s guys smashed your office window. Pay him back!', kind: 'bad' }); }
      if (s.shark) s.sharkDue = s.day + 3; else s.sharkDue = 0;
    }
    for (const r of s.requests.filter(x => x.until < s.day)) report.events.push({ text: `${r.who} found their ${DW.MODELS[r.mid].make} ${DW.MODELS[r.mid].model} somewhere else.`, kind: '' });
    s.requests = s.requests.filter(x => x.until >= s.day);
    if (s.requests.length < 3 && chance(0.2)) { const e = celebrity(s); if (e) report.events.push(e); }
    s.ads = s.ads.filter(a => a.until > s.day);
    s.effects = s.effects.filter(e => e.until > s.day);
    // random event
    if (chance(0.38)) { const e = weighted(EVENTS, x => x.w).run(s); if (e) report.events.push(e); }
    refreshMarkets(s, false);
    makeAuction(s);
    refreshClassifieds(s);
    if (s.day >= s.hireDay || !s.hirePool) refreshHires(s);
    // auto-pricing: every car still on the lot gets re-priced against today's market
    if (s.autoPrice) for (const car of s.cars) if (!car.job) car.ask = DW.listPrice(s, car);
    // fleet contracts: unfinished ones lapse (and the company grumbles), new ones arrive
    for (const c of s.contracts.filter(x => x.until < s.day)) { addRep(s, -2); report.events.push({ text: `${c.who} gave up on you: ${c.delivered}/${c.count} cars delivered. They’re telling people.`, kind: 'bad' }); }
    s.contracts = s.contracts.filter(x => x.until >= s.day);
    if (s.levels.lot >= 1 && s.contracts.length < 2 && chance(0.3)) { const c = makeContract(s); s.contracts.push(c); report.events.push({ text: `New fleet contract: ${c.who} wants ${c.count} ${c.what} (${c.minCond}+ condition) by day ${c.until}, paying ${Math.round((c.mult - 1) * 100)}% over value plus a bonus.`, kind: 'good' }); }
    for (const c of s.cars) if (!s.dex[c.mid]) s.dex[c.mid] = s.day;
    // keep the asking prices of untouched cars, but point out bargains/overpricing in the screen
    // out of cash: the bank covers it if it can, otherwise cars get sold to the wholesaler
    if (s.cash < 0) {
      const room = DW.bankLimit(s) - s.bank;
      if (room > 0) { const need = Math.min(room, -s.cash + 500); s.bank += need; s.cash += need; report.events.push({ text: `You ran out of cash. The bank covered $${fmt(need)} (added to your loan).`, kind: 'bad' }); }
      while (s.cash < 0 && s.cars.some(c => !c.job)) { const c = s.cars.filter(x => !x.job).sort((a, b) => DW.value(s, a) - DW.value(s, b))[0]; const r = DW.wholesale(s, c.id); report.events.push({ text: `Fire sale to cover your bills: ${r.msg}`, kind: 'bad' }); }
      if (s.cash < 0 && !s.cars.length) s.bankrupt = true;
    }
    if (DW.netWorth(s) < -5000 && s.cash < 0) s.bankrupt = true;
    s.history.push(DW.netWorth(s)); if (s.history.length > 60) s.history.shift();
    if (report.today.profit > s.best.day) s.best.day = report.today.profit;
    report.trophies = DW.checkTrophies(s);
    report.rep = { from: repStart, to: s.rep, complaints: report.events.filter(e => /is back:/.test(e.text)).length, unserved: report.today.unserved };
    for (const e of report.events) DW.note(s, e.text, e.kind);
    s.today = null;
    return report;
  };

  // first open of a save: make sure everything the game expects is there
  DW.ready = function (s) {
    if (!s || s.v !== SAVE_VERSION || !Array.isArray(s.cars)) return null;
    upgradeSave(s);
    if (!s.auction || s.auction.day !== s.day) makeAuction(s);
    if (!s.classifieds) refreshClassifieds(s);
    if (!s.hirePool) refreshHires(s);
    return s;
  };
  DW.summary = s => ({ earned: s.earned, carsSold: s.carsSold, netWorth: DW.netWorth(s), day: s.day, cash: s.cash, rep: Math.round(s.rep), runs: s.runs, tier: DW.tier(s).name });
})(globalThis.DW = globalThis.DW || {});
