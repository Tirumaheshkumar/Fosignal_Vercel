module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const sources = [
    'https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1m&range=1d',
    'https://query2.finance.yahoo.com/v8/finance/chart/CL=F?interval=1m&range=1d',
  ];

  for (const url of sources) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) continue;
      const d = await r.json();
      const meta = d?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) continue;
      const ltp  = +meta.regularMarketPrice.toFixed(2);
      const open = +meta.chartPreviousClose.toFixed(2);
      return res.status(200).json({
        price:  ltp,
        open:   open,
        high:   +meta.regularMarketDayHigh.toFixed(2),
        low:    +meta.regularMarketDayLow.toFixed(2),
        change: +((ltp - open) / open * 100).toFixed(2),
        vol:    meta.regularMarketVolume ? Math.round(meta.regularMarketVolume / 1000) + 'K' : '—',
        src:    'yahoo',
        ts:     Date.now()
      });
    } catch(e) { continue; }
  }

  return res.status(503).json({ error: 'All WTI sources failed' });
};
