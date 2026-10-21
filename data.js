// ============================================================
//  Dealer Wars: car models, names and upgrade tables.
//  "book" is what an average example (about 65/100 condition, normal miles)
//  is worth today in US dollars. rarity: 1 common, 2 uncommon, 3 rare, 4 legendary.
//  Collectibles keep or gain value with age instead of losing it.
// ============================================================
(function (DW) {
  'use strict';

  // make, model, first year, last year, body style, segment, book value, rarity, collectible
  const M = (make, model, from, to, body, seg, book, rarity, collectible) =>
    ({ make, model, from, to, body, seg, book, rarity, collectible: !!collectible });

  DW.MODELS = [
    // ---- cheap commuters and beaters ----
    M('Chevrolet', 'Cavalier', 1998, 2005, 'sedan', 'economy', 1900, 1),
    M('Dodge', 'Neon', 2000, 2005, 'sedan', 'economy', 2100, 1),
    M('Saturn', 'Ion', 2003, 2007, 'sedan', 'economy', 2200, 1),
    M('Ford', 'Taurus', 2000, 2007, 'sedan', 'family', 2600, 1),
    M('Pontiac', 'Grand Am', 1999, 2005, 'sedan', 'economy', 2300, 1),
    M('Buick', 'LeSabre', 2000, 2005, 'sedan', 'family', 2800, 1),
    M('Ford', 'Focus', 2008, 2016, 'hatch', 'economy', 5200, 1),
    M('Chevrolet', 'Cruze', 2011, 2018, 'sedan', 'economy', 6100, 1),
    M('Nissan', 'Sentra', 2007, 2018, 'sedan', 'economy', 5600, 1),
    M('Volkswagen', 'Jetta', 2006, 2017, 'sedan', 'economy', 5700, 1),
    M('Kia', 'Soul', 2010, 2019, 'hatch', 'economy', 6600, 1),
    M('Hyundai', 'Elantra', 2011, 2019, 'sedan', 'economy', 7000, 1),
    M('Honda', 'Civic', 2006, 2015, 'sedan', 'economy', 7300, 1),
    M('Toyota', 'Corolla', 2005, 2016, 'sedan', 'economy', 7600, 1),
    M('Mazda', 'Mazda3', 2010, 2018, 'hatch', 'economy', 8000, 1),
    M('Honda', 'Fit', 2009, 2019, 'hatch', 'economy', 8600, 1),
    M('Toyota', 'Prius', 2010, 2019, 'hatch', 'economy', 9600, 1),
    // ---- family cars, wagons and vans ----
    M('Dodge', 'Grand Caravan', 2008, 2020, 'van', 'family', 7200, 1),
    M('Nissan', 'Altima', 2008, 2019, 'sedan', 'family', 7600, 1),
    M('Chevrolet', 'Malibu', 2010, 2020, 'sedan', 'family', 8100, 1),
    M('Ford', 'Fusion', 2010, 2020, 'sedan', 'family', 8600, 1),
    M('Toyota', 'Camry', 2008, 2020, 'sedan', 'family', 11200, 1),
    M('Honda', 'Accord', 2008, 2020, 'sedan', 'family', 11600, 1),
    M('Subaru', 'Outback', 2010, 2020, 'wagon', 'family', 12200, 1),
    M('Honda', 'Odyssey', 2011, 2020, 'van', 'family', 13400, 1),
    M('Toyota', 'Sienna', 2011, 2020, 'van', 'family', 15200, 1),
    // ---- SUVs ----
    M('Subaru', 'Forester', 2010, 2020, 'suv', 'suv', 11300, 1),
    M('Ford', 'Explorer', 2011, 2020, 'suv', 'suv', 13300, 1),
    M('Honda', 'CR-V', 2010, 2020, 'suv', 'suv', 14200, 1),
    M('Jeep', 'Grand Cherokee', 2011, 2020, 'suv', 'suv', 14600, 1),
    M('Toyota', 'RAV4', 2010, 2020, 'suv', 'suv', 15400, 1),
    M('Jeep', 'Wrangler', 2007, 2020, 'suv', 'suv', 21500, 2),
    M('Chevrolet', 'Tahoe', 2010, 2020, 'suv', 'suv', 22500, 1),
    M('Toyota', '4Runner', 2010, 2020, 'suv', 'suv', 26500, 2),
    // ---- trucks ----
    M('Nissan', 'Frontier', 2010, 2020, 'truck', 'truck', 13200, 1),
    M('Chevrolet', 'Silverado 1500', 2010, 2020, 'truck', 'truck', 19200, 1),
    M('Ram', '1500', 2010, 2020, 'truck', 'truck', 19400, 1),
    M('Ford', 'F-150', 2010, 2020, 'truck', 'truck', 20500, 1),
    M('Toyota', 'Tacoma', 2010, 2020, 'truck', 'truck', 24500, 2),
    M('Toyota', 'Tundra', 2010, 2020, 'truck', 'truck', 25500, 1),
    // ---- luxury ----
    M('Audi', 'A4', 2010, 2019, 'sedan', 'luxury', 12800, 1),
    M('BMW', '3 Series', 2010, 2019, 'sedan', 'luxury', 13300, 1),
    M('Mercedes-Benz', 'C-Class', 2010, 2019, 'sedan', 'luxury', 13800, 1),
    M('Lexus', 'LS 460', 2007, 2017, 'sedan', 'luxury', 16500, 2),
    M('Lexus', 'RX 350', 2010, 2020, 'suv', 'luxury', 20500, 1),
    M('Tesla', 'Model 3', 2018, 2023, 'sedan', 'luxury', 26500, 1),
    M('Tesla', 'Model S', 2014, 2020, 'sedan', 'luxury', 30500, 2),
    M('Cadillac', 'Escalade', 2010, 2020, 'suv', 'luxury', 32500, 2),
    M('Land Rover', 'Range Rover Sport', 2014, 2020, 'suv', 'luxury', 33500, 2),
    // ---- sports cars ----
    M('Mazda', 'MX-5 Miata', 1990, 2015, 'roadster', 'sports', 10500, 2),
    M('Volkswagen', 'Golf GTI', 2010, 2020, 'hatch', 'sports', 15200, 1),
    M('Nissan', '370Z', 2009, 2020, 'coupe', 'sports', 18500, 2),
    M('Porsche', 'Boxster', 2005, 2016, 'roadster', 'sports', 22500, 2),
    M('Ford', 'Mustang GT', 2011, 2020, 'coupe', 'sports', 24500, 1),
    M('Subaru', 'WRX STI', 2008, 2020, 'sedan', 'sports', 24500, 2),
    M('Chevrolet', 'Camaro SS', 2010, 2020, 'coupe', 'sports', 25500, 1),
    M('Dodge', 'Challenger R/T', 2011, 2020, 'coupe', 'sports', 25500, 1),
    M('Honda', 'S2000', 2000, 2009, 'roadster', 'sports', 31000, 3, true),
    M('Mitsubishi', 'Lancer Evolution', 2003, 2015, 'sedan', 'sports', 31000, 3, true),
    M('Chevrolet', 'Corvette C6', 2005, 2013, 'coupe', 'sports', 32500, 2),
    M('BMW', 'M3 (E92)', 2008, 2013, 'coupe', 'sports', 33000, 3),
    M('Porsche', '911 Carrera', 2005, 2012, 'coupe', 'sports', 52000, 3),
    M('Dodge', 'Viper', 2003, 2010, 'roadster', 'sports', 72000, 3, true),
    // ---- classics and muscle ----
    M('Volkswagen', 'Beetle', 1960, 1975, 'classic', 'classic', 12500, 2, true),
    M('Chevrolet', 'Bel Air', 1955, 1957, 'classic', 'classic', 52000, 3, true),
    M('Pontiac', 'GTO', 1964, 1970, 'muscle', 'classic', 56000, 3, true),
    M('Ford', 'Bronco', 1966, 1977, 'suv', 'classic', 61000, 3, true),
    M('Chevrolet', 'Chevelle SS', 1966, 1972, 'muscle', 'classic', 66000, 3, true),
    M('Ford', 'Mustang Fastback', 1965, 1968, 'muscle', 'classic', 71000, 3, true),
    M('Chevrolet', 'Camaro SS', 1967, 1969, 'muscle', 'classic', 76000, 3, true),
    M('Dodge', 'Charger R/T', 1968, 1970, 'muscle', 'classic', 112000, 4, true),
    M('Plymouth', 'Hemi ’Cuda', 1970, 1971, 'muscle', 'classic', 260000, 4, true),
    // ---- Japanese legends ----
    M('Mazda', 'RX-7 (FD)', 1993, 1995, 'coupe', 'jdm', 46000, 3, true),
    M('Toyota', 'Supra Turbo', 1993, 1998, 'coupe', 'jdm', 98000, 4, true),
    M('Acura', 'NSX', 1991, 2005, 'exotic', 'jdm', 112000, 4, true),
    M('Nissan', 'Skyline GT-R (R34)', 1999, 2002, 'coupe', 'jdm', 185000, 4, true),
    // ---- exotics ----
    M('DeLorean', 'DMC-12', 1981, 1983, 'exotic', 'exotic', 62000, 3, true),
    M('Lamborghini', 'Gallardo', 2004, 2013, 'exotic', 'exotic', 88000, 3),
    M('Ferrari', '308 GTS', 1977, 1985, 'exotic', 'exotic', 92000, 3, true),
    M('Ferrari', '458 Italia', 2010, 2015, 'exotic', 'exotic', 205000, 4),
    M('Ford', 'GT', 2005, 2006, 'exotic', 'exotic', 460000, 4, true),
    M('Lamborghini', 'Countach', 1974, 1990, 'exotic', 'exotic', 560000, 4, true),
    M('Bugatti', 'Veyron', 2005, 2015, 'exotic', 'exotic', 1500000, 4),
    M('Porsche', '959', 1986, 1988, 'exotic', 'exotic', 1850000, 4, true),
    M('Ferrari', 'F40', 1987, 1992, 'exotic', 'exotic', 2850000, 4, true),
  ];
  DW.MODELS.forEach((m, i) => { m.id = i; });

  DW.SEGMENTS = {
    economy: 'Economy', family: 'Family', suv: 'SUV', truck: 'Truck', luxury: 'Luxury',
    sports: 'Sports', classic: 'Classic', jdm: 'JDM legend', exotic: 'Exotic',
  };
  DW.RARITY = ['', 'Common', 'Uncommon', 'Rare', 'Legendary'];

  DW.COLORS = [
    ['Arctic White', '#f2f2ee'], ['Silver Metallic', '#b9bec4'], ['Graphite Gray', '#5b6068'], ['Jet Black', '#1d1f23'],
    ['Candy Red', '#c62828'], ['Navy Blue', '#1f3a68'], ['Electric Blue', '#2f7de1'], ['Forest Green', '#2e5e3a'],
    ['Sunburst Yellow', '#f2c230'], ['Burnt Orange', '#e06a1b'], ['Champagne', '#d8c7a1'], ['Maroon', '#6e1f2b'],
    ['Teal', '#1f8a8a'], ['Lime Green', '#7cc242'], ['Purple Haze', '#6b3fa0'], ['Bronze', '#9a6b3a'],
  ];

  // hidden problems: [name, mechanical damage, fix-cost factor]
  DW.ISSUES = [
    ['Slipping transmission', 45], ['Blown head gasket', 50], ['Rod knock', 60], ['Failing turbo', 35],
    ['Rusted-out frame', 40], ['Flood damage', 55], ['Electrical gremlins', 25], ['Bad wheel bearings', 15],
    ['Leaking rear main seal', 20], ['Cracked radiator', 18], ['Worn timing chain', 30], ['Odometer rollback', 0],
  ];

  DW.FIRST = ['Mike', 'Dana', 'Luis', 'Tasha', 'Earl', 'Priya', 'Vinnie', 'Rosa', 'Gus', 'Kim', 'Tony', 'Brenda',
    'Marcus', 'Joy', 'Ray', 'Lena', 'Hank', 'Mo', 'Trish', 'Sal', 'Dee', 'Omar', 'Jolene', 'Big Jim'];
  DW.LAST = ['Rossi', 'Nguyen', 'Kowalski', 'Brooks', 'Delgado', 'Fitch', 'Haskins', 'Moreno', 'Patel', 'Sutter',
    'Vance', 'Whitaker', 'Okafor', 'Lindqvist', 'Barnes', 'Tran'];

  // ---- upgrades: each level is { name, cost, perDay (upkeep), ...effects } ----
  DW.UPGRADES = {
    lot: { label: 'Car lot', icon: '\u{1F17F}', levels: [
      { name: 'Gravel lot', cost: 0, perDay: 60, spaces: 6 },
      { name: 'Paved lot', cost: 18000, perDay: 110, spaces: 10 },
      { name: 'Big lot', cost: 55000, perDay: 200, spaces: 16 },
      { name: 'Super lot', cost: 140000, perDay: 340, spaces: 24 },
      { name: 'Auto mall', cost: 380000, perDay: 600, spaces: 32 },
    ] },
    showroom: { label: 'Showroom', icon: '\u{1F3EC}', levels: [
      { name: 'Trailer office', cost: 0, perDay: 0, traffic: 0, premium: 0 },
      { name: 'Small showroom', cost: 40000, perDay: 90, traffic: 1, premium: 0.03 },
      { name: 'Glass showroom', cost: 150000, perDay: 220, traffic: 2, premium: 0.06 },
      { name: 'Flagship store', cost: 520000, perDay: 520, traffic: 4, premium: 0.1 },
    ] },
    shop: { label: 'Mechanic & body shop', icon: '\u{1F527}', levels: [
      { name: 'None (outsourced)', cost: 0, perDay: 0, costMult: 1.0, days: 2, max: 92, bays: 99 },
      { name: 'One-bay garage', cost: 25000, perDay: 80, costMult: 0.72, days: 1, max: 95, bays: 1 },
      { name: 'Full service shop', cost: 80000, perDay: 170, costMult: 0.58, days: 1, max: 98, bays: 3 },
      { name: 'Restoration center', cost: 230000, perDay: 330, costMult: 0.48, days: 0, max: 100, bays: 6 },
    ] },
    detail: { label: 'Detail bay', icon: '\u{1F9FD}', levels: [
      { name: 'None (outsourced)', cost: 0, perDay: 0, costMult: 1.0, instant: false },
      { name: 'Wash & wax bay', cost: 9000, perDay: 35, costMult: 0.6, instant: true },
      { name: 'Pro detail studio', cost: 32000, perDay: 80, costMult: 0.42, instant: true },
    ] },
    finance: { label: 'Finance office', icon: '\u{1F4B3}', levels: [
      { name: 'Cash only', cost: 0, perDay: 0, buyers: 0, markup: 0 },
      { name: 'Finance desk', cost: 22000, perDay: 60, buyers: 0.15, markup: 0.02 },
      { name: 'Full F&I office', cost: 75000, perDay: 140, buyers: 0.3, markup: 0.04 },
    ] },
    billboard: { label: 'Billboard', icon: '\u{1FAA7}', levels: [
      { name: 'No billboard', cost: 0, perDay: 0, traffic: 0 },
      { name: 'Highway billboard', cost: 20000, perDay: 40, traffic: 1 },
      { name: 'Digital billboard', cost: 65000, perDay: 90, traffic: 2 },
    ] },
    insurance: { label: 'Insurance', icon: '\u{1F6E1}️', levels: [
      { name: 'No insurance', cost: 0, perDay: 0 },
      { name: 'Lot insurance', cost: 2500, perDay: 45 },
    ] },
  };

  DW.ADS = [
    { id: 'paper', name: 'Newspaper ad', cost: 600, days: 3, traffic: 1.5 },
    { id: 'radio', name: 'Radio spot', cost: 3500, days: 5, traffic: 3 },
    { id: 'social', name: 'Social media blitz', cost: 7500, days: 4, traffic: 4, rep: 2 },
    { id: 'tv', name: 'Late-night TV commercial', cost: 18000, days: 7, traffic: 5, rep: 4 },
  ];
})(globalThis.DW = globalThis.DW || {});
