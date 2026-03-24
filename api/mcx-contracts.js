// /api/mcx-contracts.js
// Fetches the Upstox instrument list and returns the nearest active
// contract for each MCX commodity — auto-updates every month automatically.

module.module.exports = async function handler
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // Cache 1hr on CDN

  const MCX_SYMBOLS = ['CRUDEOIL', 'NATURALGAS', 'GOLD', 'GOLDM', 'SILVER', 'SILVERM', 'COPPER', 'ZINC', 'LEAD', 'NICKEL', 'ALUMINIUM'];

  try {
    // Upstox publishes a public instrument CSV — no auth needed
    const r = await fetch(
      'https://assets.upstox.com/market-quote/instruments/exchange/MCX.csv.gz',
      { headers: { 'Accept-Encoding': 'gzip' } }
    );

    if (!r.ok) throw new Error('MCX CSV fetch failed: ' + r.status);

    // Parse the CSV text
    const text = await r.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    const today = new Date();
    const todayMs = today.getTime();

    // Find column indices
    const iKey    = headers.indexOf('instrument_key');
    const iSym    = headers.indexOf('tradingsymbol');
    const iName   = headers.indexOf('name');
    const iExp    = headers.indexOf('expiry');
    const iLot    = headers.indexOf('lot_size');
    const iLast   = headers.indexOf('last_price');
    const iType   = headers.indexOf('instrument_type');

    // Group contracts by base symbol
    const groups = {};

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
      if (cols.length < 5) continue;

      const type   = cols[iType] || '';
      const sym    = cols[iSym]  || '';
      const key    = cols[iKey]  || '';
      const expStr = cols[iExp]  || '';
      const lot    = parseInt(cols[iLot]) || 1;
      const last   = parseFloat(cols[iLast]) || 0;

      if (type !== 'FUT') continue;

      // Match base symbol
      const base = MCX_SYMBOLS.find(s => sym.startsWith(s));
      if (!base) continue;

      // Parse expiry
      const expDate = new Date(expStr);
      if (isNaN(expDate.getTime())) continue;

      // Only future or very recent (within 3 days past) contracts
      const diffDays = (expDate.getTime() - todayMs) / (1000 * 60 * 60 * 24);
      if (diffDays < -3) continue;

      if (!groups[base]) groups[base] = [];
      groups[base].push({
        key,
        symbol: sym,
        expiry: expStr,
        expiryDate: expDate,
        expiryLabel: formatExpiry(expDate),
        lot,
        last,
        daysLeft: Math.ceil(diffDays),
      });
    }

    // Sort each group by expiry, return up to 3 nearest contracts
    const result = {};
    for (const base of MCX_SYMBOLS) {
      if (!groups[base]) continue;
      groups[base].sort((a, b) => a.expiryDate - b.expiryDate);
      result[base] = groups[base].slice(0, 3).map((c, idx) => ({
        ...c,
        isNearest: idx === 0,
        expiryDate: undefined, // don't serialize Date objects
      }));
    }

    return res.status(200).json({
      ok: true,
      contracts: result,
      fetchedAt: new Date().toISOString(),
    });

  } catch (e) {
    // Fallback: return month-derived tokens so app still works
    return res.status(200).json({
      ok: false,
      error: e.message,
      contracts: buildFallback(),
      fetchedAt: new Date().toISOString(),
    });
  }
}

function formatExpiry(date) {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function buildFallback() {
  // Generate month codes for next 3 months automatically
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const now = new Date();
  const contracts = {};
  const syms = ['CRUDEOIL','NATURALGAS','GOLD','SILVER','COPPER','ZINC'];

  syms.forEach(sym => {
    contracts[sym] = [];
    for (let m = 0; m < 3; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const yy = String(d.getFullYear()).slice(2);
      const mon = months[d.getMonth()];
      const key = `MCX_FO|${sym}${yy}${mon}FUT`;
      contracts[sym].push({
        key,
        symbol: `${sym}${yy}${mon}FUT`,
        expiry: d.toISOString().slice(0,10),
        expiryLabel: `${mon} '${yy}`,
        lot: getLot(sym),
        last: 0,
        daysLeft: m * 30,
        isNearest: m === 0,
      });
    }
  });
  return contracts;
}

function getLot(sym) {
  const lots = { CRUDEOIL: 10, NATURALGAS: 250, GOLD: 10, GOLDM: 10, SILVER: 5, SILVERM: 5, COPPER: 25, ZINC: 100, LEAD: 100, NICKEL: 15, ALUMINIUM: 5 };
  return lots[sym] || 1;
}
