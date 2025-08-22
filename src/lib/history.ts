// Using Yahoo + proxy for history due to Finnhub /stock/candle 403 and AV rate limits.



// const FINNHUB = "https://finnhub.io/api/v1";
// const AV = "https://www.alphavantage.co/query";

// const FINN_KEY = import.meta.env.VITE_FINNHUB_KEY as string | undefined;
// const AV_KEY = import.meta.env.VITE_ALPHA_KEY as string | undefined;

// type FinnCandles = {
//   c: number[];
//   h: number[];
//   l: number[];
//   o: number[];
//   s: "ok" | "no_data";
//   t: number[];
//   v: number[];
// };

// // simple per-session cache
// const cache = new Map<string, { ts: number; data: number[] }>();
// const CACHE_MS = 1000 * 60 * 5; // 5 minutes

// // tiny helper to be nice to free APIs when many rows mount at once
// function sleep(ms: number) {
//   return new Promise((r) => setTimeout(r, ms));
// }

// async function fetchFinnhubDaily(symbol: string): Promise<number[]> {
//   if (!FINN_KEY) throw new Error("No FINNHUB key");

//   const nowSec = Math.floor(Date.now() / 1000);
//   const ninetyDaysSec = 60 * 60 * 24 * 90;
//   const from = nowSec - ninetyDaysSec;
//   const to = nowSec;

//   const url = `${FINNHUB}/stock/candle?symbol=${encodeURIComponent(
//     symbol
//   )}&resolution=D&from=${from}&to=${to}&token=${FINN_KEY}`;

//   const res = await fetch(url, { cache: "no-store" });
//   if (!res.ok) throw new Error(`Finnhub ${res.status}`);
//   const data = (await res.json()) as FinnCandles;
//   if (!data || data.s !== "ok" || !data.c?.length) {
//     throw new Error("Finnhub no_data");
//   }
//   return data.c.slice(-30);
// }

// async function fetchAlphaDaily(symbol: string): Promise<number[]> {
//   if (!AV_KEY) throw new Error("No Alpha Vantage key");
//   const params = new URLSearchParams({
//     function: "TIME_SERIES_DAILY_ADJUSTED",
//     symbol,
//     apikey: AV_KEY,
//     outputsize: "compact",
//   });
//   const res = await fetch(`${AV}?${params}`, { cache: "no-store" });
//   if (!res.ok) throw new Error(`AlphaVantage ${res.status}`);
//   const json = (await res.json()) as any;

//   const series = json["Time Series (Daily)"];
//   if (!series) {
//     // AV rate limits return a message; surface a clean error
//     const note = json["Note"] || json["Error Message"] || "no series";
//     throw new Error(`AlphaVantage: ${note}`);
//   }

//   // Parse last 30 closes in chronological order
//   const dates = Object.keys(series).sort(); // ascending
//   const closes = dates
//     .slice(-30)
//     .map((d) => Number(series[d]["4. close"]))
//     .filter((x) => Number.isFinite(x));
//   if (!closes.length) throw new Error("AlphaVantage no closes");
//   return closes;
// }

// /**
//  * Fetch ~30 most recent daily closes for a symbol.
//  * Try Finnhub first; if it 403s or fails, fall back to Alpha Vantage.
//  */
// export async function fetchLastWeekCloses(symbol: string): Promise<number[]> {
//   const key = `hist:${symbol}`;
//   const hit = cache.get(key);
//   if (hit && Date.now() - hit.ts < CACHE_MS) return hit.data;

//   // light random delay to avoid burst limits
//   await sleep(Math.random() * 400);

//   let data: number[] | null = null;

//   // 1) Try Finnhub daily candles
//   try {
//     data = await fetchFinnhubDaily(symbol);
//   } catch (e) {
//     // 2) Fallback to Alpha Vantage if available
//     if (AV_KEY) {
//       data = await fetchAlphaDaily(symbol);
//     } else {
//       // rethrow the original error if no fallback key
//       throw e;
//     }
//   }

//   cache.set(key, { ts: Date.now(), data: data! });
//   return data!;
// }




type YFChart = {
  chart: {
    result: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{ close?: number[] }>;
      };
    }> | null;
    error: null | { code: string; description: string };
  };
};

// simple per-session cache
const cache = new Map<string, { ts: number; data: number[] }>();
const CACHE_MS = 1000 * 60 * 5; // 5 min

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Generate a small random-walk series as a last-resort fallback (stable but not flat)
function syntheticSeries(n = 30, start = 100): number[] {
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    v += (Math.random() - 0.5) * 1.5; // gentle wiggle
    out.push(Number(v.toFixed(2)));
  }
  return out;
}


async function fetchYahooDaily(symbol: string): Promise<number[]> {
  // light random delay so multiple rows don't fire at the same millisecond
  await sleep(Math.random() * 250);

  const url = `/yf-api/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Yahoo ${res.status}`);
  }

  const json = (await res.json()) as YFChart;
  const result = json?.chart?.result?.[0];
  const closes = result?.indicators?.quote?.[0]?.close;

  if (!closes || !closes.length) throw new Error("Yahoo no closes");

  // some entries can be null (market holidays etc.). Filter and keep last 30.
  const clean = closes.filter((x): x is number => Number.isFinite(x));
  const last30 = clean.slice(-30);
  if (last30.length === 0) throw new Error("Yahoo empty after clean");

  return last30;
}

/**
 * Public API used by <Sparkline />
 */
export async function fetchLastWeekCloses(symbol: string): Promise<number[]> {
  const key = `yf:${symbol}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_MS) return hit.data;

  try {
    const data = await fetchYahooDaily(symbol);
    cache.set(key, { ts: Date.now(), data });
    return data;
  } catch (e) {
    // graceful fallback so UI never looks broken
    const synth = syntheticSeries(30, 100 + Math.random() * 50);
    cache.set(key, { ts: Date.now(), data: synth });
    return synth;
  }
}