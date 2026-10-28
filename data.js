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

    // ---- added later: more everyday cars (new models go at the END so saved cars keep their model) ----
    M('Chevrolet', 'Aveo', 2004, 2011, 'hatch', 'economy', 2400, 1),
    M('Pontiac', 'Aztek', 2001, 2005, 'suv', 'suv', 3200, 1),
    M('Mitsubishi', 'Mirage', 2014, 2020, 'hatch', 'economy', 5200, 1),
    M('Kia', 'Rio', 2012, 2020, 'sedan', 'economy', 5600, 1),
    M('Mini', 'Cooper', 2007, 2018, 'hatch', 'economy', 7800, 1),
    M('Subaru', 'Impreza', 2008, 2020, 'sedan', 'economy', 8500, 1),
    M('Volkswagen', 'Golf', 2010, 2020, 'hatch', 'economy', 9000, 1),
    M('Chevrolet', 'Impala', 2006, 2020, 'sedan', 'family', 7400, 1),
    M('Kia', 'Optima', 2011, 2020, 'sedan', 'family', 8600, 1),
    M('Hyundai', 'Sonata', 2011, 2020, 'sedan', 'family', 8800, 1),
    M('Chrysler', '300', 2011, 2020, 'sedan', 'family', 11500, 1),
    M('Dodge', 'Charger', 2011, 2020, 'sedan', 'family', 14500, 1),
    M('Chrysler', 'Pacifica', 2017, 2022, 'van', 'family', 19000, 1),
    M('Ford', 'Escape', 2010, 2020, 'suv', 'suv', 8200, 1),
    M('Chevrolet', 'Equinox', 2010, 2020, 'suv', 'suv', 9500, 1),
    M('Nissan', 'Rogue', 2010, 2020, 'suv', 'suv', 10200, 1),
    M('Jeep', 'Cherokee', 2014, 2020, 'suv', 'suv', 11500, 1),
    M('Toyota', 'Highlander', 2010, 2020, 'suv', 'suv', 21000, 1),
    M('Ford', 'Bronco (new)', 2021, 2024, 'suv', 'suv', 41000, 2),
    M('Toyota', 'Land Cruiser', 2008, 2021, 'suv', 'suv', 42000, 2),
    M('Chevrolet', 'Colorado', 2015, 2022, 'truck', 'truck', 21000, 1),
    M('GMC', 'Sierra 1500', 2014, 2020, 'truck', 'truck', 24000, 1),
    M('Ford', 'Ranger', 2019, 2023, 'truck', 'truck', 25000, 1),
    M('Ford', 'F-250 Super Duty', 2011, 2020, 'truck', 'truck', 31000, 1),
    M('Ford', 'F-150 Raptor', 2017, 2020, 'truck', 'truck', 52000, 3),
    M('Audi', 'Q5', 2011, 2020, 'suv', 'luxury', 16500, 1),
    M('Mercedes-Benz', 'E-Class', 2010, 2019, 'sedan', 'luxury', 17500, 1),
    M('BMW', 'X5', 2011, 2020, 'suv', 'luxury', 22000, 1),
    M('Porsche', 'Cayenne', 2011, 2020, 'suv', 'luxury', 31000, 2),
    M('Tesla', 'Model Y', 2020, 2024, 'suv', 'luxury', 31000, 1),
    M('Porsche', 'Macan', 2015, 2021, 'suv', 'luxury', 34000, 2),
    M('Rivian', 'R1T', 2022, 2024, 'truck', 'luxury', 58000, 2),
    M('Lucid', 'Air', 2022, 2024, 'sedan', 'luxury', 62000, 3),
    M('Mercedes-Benz', 'G-Class', 2010, 2020, 'suv', 'luxury', 72000, 3),
    M('Toyota', 'GR86', 2022, 2024, 'coupe', 'sports', 29000, 2),
    M('Ford', 'Focus RS', 2016, 2018, 'hatch', 'sports', 31000, 3, true),
    M('Honda', 'Civic Type R', 2017, 2021, 'hatch', 'sports', 36000, 2),
    M('BMW', 'M5', 2012, 2020, 'sedan', 'sports', 42000, 3),
    M('Lotus', 'Elise', 2005, 2011, 'roadster', 'sports', 48000, 3, true),
    M('Alfa Romeo', '4C', 2015, 2020, 'coupe', 'sports', 55000, 3),
    M('Chevrolet', 'Corvette C8', 2020, 2024, 'exotic', 'sports', 68000, 2),
    M('Nissan', 'GT-R', 2009, 2020, 'coupe', 'sports', 78000, 3),
    M('Mercedes-AMG', 'GT', 2016, 2021, 'coupe', 'sports', 82000, 3),
    // ---- more classics and legends ----
    M('AMC', 'Gremlin', 1970, 1978, 'hatch', 'classic', 7500, 2, true),
    M('Yugo', 'GV', 1986, 1991, 'hatch', 'classic', 3500, 2, true),
    M('Ford', 'Pinto', 1971, 1980, 'hatch', 'classic', 6500, 2, true),
    M('Ford', 'Model A', 1928, 1931, 'classic', 'classic', 24000, 3, true),
    M('Chevrolet', 'C10', 1967, 1972, 'truck', 'classic', 38000, 3, true),
    M('Chevrolet', 'Nova SS', 1968, 1972, 'muscle', 'classic', 42000, 3, true),
    M('Pontiac', 'Firebird Trans Am', 1977, 1981, 'muscle', 'classic', 46000, 3, true),
    M('Chevrolet', 'Impala SS', 1961, 1964, 'classic', 'classic', 48000, 3, true),
    M('Buick', 'Grand National', 1984, 1987, 'coupe', 'classic', 52000, 3, true),
    M('Oldsmobile', '442', 1968, 1972, 'muscle', 'classic', 58000, 3, true),
    M('Toyota', 'Land Cruiser FJ40', 1970, 1983, 'suv', 'classic', 68000, 3, true),
    M('Cadillac', 'Eldorado Biarritz', 1959, 1959, 'classic', 'classic', 95000, 3, true),
    M('Jaguar', 'E-Type', 1961, 1974, 'roadster', 'classic', 155000, 4, true),
    M('Shelby', 'GT500', 1967, 1968, 'muscle', 'classic', 210000, 4, true),
    M('Toyota', 'Corolla GT-S (AE86)', 1984, 1987, 'coupe', 'jdm', 32000, 3, true),
    M('Nissan', 'Silvia S15', 1999, 2002, 'coupe', 'jdm', 42000, 3, true),
    M('Datsun', '240Z', 1970, 1973, 'coupe', 'jdm', 55000, 3, true),
    M('Toyota', '2000GT', 1967, 1970, 'coupe', 'jdm', 1100000, 4, true),
    M('Audi', 'R8', 2008, 2015, 'exotic', 'exotic', 85000, 3),
    M('Ferrari', 'Testarossa', 1984, 1991, 'exotic', 'exotic', 150000, 4, true),
    M('Lamborghini', 'Diablo', 1990, 2001, 'exotic', 'exotic', 320000, 4, true),
    M('Porsche', 'Carrera GT', 2004, 2006, 'exotic', 'exotic', 1600000, 4, true),
    // ---- MYTHIC (rarity 5): VIP auctions, the rarest barn finds, and whale collectors only ----
    M('Aston Martin', 'DB5', 1963, 1965, 'classic', 'classic', 950000, 5, true),
    M('Shelby', 'Cobra 427', 1965, 1967, 'roadster', 'classic', 1400000, 5, true),
    M('Mercedes-Benz', '300SL Gullwing', 1954, 1957, 'classic', 'classic', 1600000, 5, true),
    M('Porsche', '918 Spyder', 2013, 2015, 'exotic', 'exotic', 2000000, 5, true),
    M('Lamborghini', 'Miura', 1966, 1972, 'exotic', 'exotic', 2600000, 5, true),
    M('Koenigsegg', 'Agera', 2011, 2018, 'exotic', 'exotic', 2800000, 5, true),
    M('Bugatti', 'Chiron', 2017, 2022, 'exotic', 'exotic', 3300000, 5, true),
    M('Ferrari', 'Enzo', 2002, 2004, 'exotic', 'exotic', 3800000, 5, true),
    M('Ferrari', 'LaFerrari', 2013, 2016, 'exotic', 'exotic', 4200000, 5, true),
    M('Pagani', 'Zonda', 1999, 2011, 'exotic', 'exotic', 5500000, 5, true),
    M('Ford', 'GT40', 1965, 1969, 'exotic', 'exotic', 9500000, 5, true),
    M('McLaren', 'F1', 1993, 1998, 'exotic', 'exotic', 20000000, 5, true),
    M('Ferrari', '250 GTO', 1962, 1964, 'classic', 'exotic', 48000000, 5, true),
    // ---- Subaru specials ----
    M('Subaru', '360', 1958, 1971, 'hatch', 'classic', 18000, 2, true),
    M('Subaru', 'BRAT', 1978, 1987, 'truck', 'classic', 14000, 2, true),
    M('Subaru', 'SVX', 1992, 1997, 'coupe', 'jdm', 12000, 2, true),
    M('Subaru', 'Legacy GT spec.B', 2006, 2009, 'sedan', 'sports', 15000, 2),
    M('Subaru', 'Impreza WRX STi Type R (GC8)', 1998, 2000, 'coupe', 'jdm', 45000, 3, true),
    M('Subaru', 'Impreza P1 (Prodrive)', 2000, 2001, 'coupe', 'jdm', 55000, 3, true),
    M('Subaru', 'Impreza WRX STI S203', 2005, 2005, 'sedan', 'jdm', 80000, 3, true),
    M('Subaru', 'Impreza WRX STI S204', 2006, 2006, 'sedan', 'jdm', 85000, 3, true),
    M('Subaru', 'WRX STI S209', 2022, 2022, 'sedan', 'sports', 90000, 3, true),
    M('Subaru', 'Impreza 22B STi', 1998, 1998, 'coupe', 'jdm', 400000, 4, true),
  ];
  DW.MODELS.forEach((m, i) => { m.id = i; });

  DW.SEGMENTS = {
    economy: 'Economy', family: 'Family', suv: 'SUV', truck: 'Truck', luxury: 'Luxury',
    sports: 'Sports', classic: 'Classic', jdm: 'JDM legend', exotic: 'Exotic',
  };
  DW.RARITY = ['', 'Common', 'Uncommon', 'Rare', 'Legendary', 'Mythic'];

  // reputation tiers: what people call you, and what it opens up
  DW.REP_TIERS = [
    { min: 0, name: 'Shady lot' }, { min: 20, name: 'Local dealer' }, { min: 40, name: 'Trusted dealer' },
    { min: 60, name: 'Premier dealer', perk: 'VIP Invitational auctions (with a glass showroom) and whale collectors' },
    { min: 80, name: 'Legendary dealer', perk: 'The best salespeople want to work for you' },
  ];
  DW.VIP_REP = 60; // reputation needed for the VIP Invitational (plus a glass showroom or better)

  // branch dealerships: bought once, they send you a cut every night (more when your name is good)
  DW.BRANCHES = [
    { id: 'eastside', name: 'Eastside Used Cars', cost: 400000, income: 1600, rep: 30 },
    { id: 'downtown', name: 'Downtown Auto Plaza', cost: 1200000, income: 4800, rep: 45 },
    { id: 'suburbs', name: 'Suburban Super Center', cost: 3000000, income: 11500, rep: 55 },
    { id: 'coast', name: 'Coastal Luxury Motors', cost: 8000000, income: 29000, rep: 70 },
    { id: 'hills', name: 'Beverly Hills Exotics', cost: 25000000, income: 85000, rep: 85 },
  ];

  // rivals at the VIP Invitational
  DW.WHALES = ['Sheikh Rahim', 'a tech billionaire', 'an anonymous phone bidder', 'Baron von Stahl', 'the Petersen Museum', 'a hedge fund manager',
    'a Formula 1 champion', 'Mr. Tanaka from Osaka', 'a Saudi royal', 'Jay from the car show on TV'];

  // trophies: each one is worth a little reputation when you earn it
  DW.TROPHIES = [
    { id: 'first', name: 'First sale', desc: 'Sell your first car', test: s => s.carsSold >= 1 },
    { id: 'sold100', name: 'Mover', desc: 'Sell 100 cars', test: s => s.carsSold >= 100 },
    { id: 'sold500', name: 'Volume dealer', desc: 'Sell 500 cars', test: s => s.carsSold >= 500 },
    { id: 'sold2000', name: 'Car tsunami', desc: 'Sell 2,000 cars', test: s => s.carsSold >= 2000 },
    { id: 'earn1m', name: 'Millionaire', desc: 'Earn $1,000,000', test: s => s.earned >= 1e6 },
    { id: 'earn10m', name: 'Eight figures', desc: 'Earn $10,000,000', test: s => s.earned >= 1e7 },
    { id: 'earn100m', name: 'Car baron', desc: 'Earn $100,000,000', test: s => s.earned >= 1e8 },
    { id: 'bigsale', name: 'Whale hunter', desc: 'Sell one car for $1,000,000 or more', test: s => s.best.sale >= 1e6 },
    { id: 'mythic', name: 'Myth maker', desc: 'Sell a Mythic car', test: s => s.stats.mythicSold >= 1 },
    { id: 'fulllot', name: 'Wall-to-wall', desc: 'Fill a 32-car lot', test: s => DW.spaces(s) >= 32 && s.cars.length >= 32 },
    { id: 'maxed', name: 'Auto empire', desc: 'Max out every upgrade', test: s => Object.keys(DW.UPGRADES).every(k => s.levels[k] >= DW.UPGRADES[k].levels.length - 1) },
    { id: 'team', name: 'Dream team', desc: 'Have 5 salespeople with 5 stars', test: s => s.staff.filter(p => p.skill >= 5).length >= 5 },
    { id: 'tony', name: 'Square with Tony', desc: 'Pay Big Tony back in full', test: s => s.stats.tonyPaid >= 1 },
    { id: 'concours', name: 'Best in show', desc: 'Win a Concours d’Elegance', test: s => s.stats.concoursWins >= 1 },
    { id: 'clients', name: 'Concierge', desc: 'Fill 5 client requests', test: s => s.stats.requests >= 5 },
    { id: 'branch', name: 'Franchise', desc: 'Open a branch dealership', test: s => s.branches.length >= 1 },
    { id: 'allbranches', name: 'Coast to coast', desc: 'Own every branch dealership', test: s => s.branches.length >= DW.BRANCHES.length },
    { id: 'rep90', name: 'Household name', desc: 'Reach 90 reputation', test: s => s.rep >= 90 },
  ];

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
    cpo: { label: 'Certified Pre-Owned', icon: '✅', levels: [
      { name: 'No CPO program', cost: 0, perDay: 0 },
      { name: 'CPO program', cost: 150000, perDay: 250 },
    ] },
  };

  DW.ADS = [
    { id: 'paper', name: 'Newspaper ad', cost: 600, days: 3, traffic: 1.5 },
    { id: 'radio', name: 'Radio spot', cost: 3500, days: 5, traffic: 3 },
    { id: 'social', name: 'Social media blitz', cost: 7500, days: 4, traffic: 4, rep: 2 },
    { id: 'tv', name: 'Late-night TV commercial', cost: 18000, days: 7, traffic: 5, rep: 4 },
  ];
})(globalThis.DW = globalThis.DW || {});
