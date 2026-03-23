module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  // Try Yahoo Finance v7 quote (server-side, no CORS issue)
  try {
    const r = await fetch(
      'https://query1.finance.yahoo.com/v7/finance/quote?symbols=CL%3DF',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    );
    if (r.ok) {
      const d = await r.json();
      const q = d?.quoteResponse?.result?.[0];
      if (q?.regularMarketPrice) {
        return res.status(200).json({
          price:  +q.regularMarketPrice.toFixed(2),
          open:   +q.regularMarketOpen.toFixed(2),
          high:   +q.regularMarketDayHigh.toFixed(2),
          low:    +q.regularMarketDayLow.toFixed(2),
          change: +q.regularMarketChangePercent.toFixed(2),
          vol:    q.regularMarketVolume ? Math.round(q.regularMarketVolume / 1000) + 'K' : '—',
          ts:     Date.now(),
          src:    'yahoo-v7'
        });
      }
    }
  } catch (e) {}

  // Fallback: Yahoo Finance v8 chart
  try {
    const r = await fetch(
      'https://query2.finance.yahoo.com/v8/finance/chart/CL=F?interval=1m&range=1d',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    );
    if (r.ok) {
      const d = await r.json();
      const meta = d?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const ltp  = +meta.regularMarketPrice.toFixed(2);
        const open = +meta.chartPreviousClose.toFixed(2);
        return res.status(200).json({
          price:  ltp,
          open:   open,
          high:   +meta.regularMarketDayHigh.toFixed(2),
          low:    +meta.regularMarketDayLow.toFixed(2),
          change: +((ltp - open) / open * 100).toFixed(2),
          vol:    meta.regularMarketVolume ? Math.round(meta.regularMarketVolume / 1000) + 'K' : '—',
          ts:     Date.now(),
          src:    'yahoo-v8'
        });
      }
    }
  } catch (e) {}

  // Fallback: stooq.com (no auth needed)
  try {
    const r = await fetch('https://stooq.com/q/l/?s=cl.f&f=sd2t2ohlcv&h&e=csv');
    if (r.ok) {
      const text = await r.text();
      const lines = text.trim().split('\n');
      if (lines.length >= 2) {
        const [, date, time, open, high, low, close, vol] = lines[1].split(',');
        if (close && close !== 'N/D') {
          return res.status(200).json({
            price:  +parseFloat(close).toFixed(2),
            open:   +parseFloat(open).toFixed(2),
            high:   +parseFloat(high).toFixed(2),
            low:    +parseFloat(low).toFixed(2),
            change: +((parseFloat(close) - parseFloat(open)) / parseFloat(open) * 100).toFixed(2),
            vol:    vol?.trim() || '—',
            ts:     Date.now(),
            src:    'stooq'
          });
        }
      }
    }
  } catch (e) {}

  return res.status(503).json({ error: 'All WTI sources failed' });
}
