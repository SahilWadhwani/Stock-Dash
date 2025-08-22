import type { Quote } from "./types";

const API_BASE = "https://finnhub.io/api/v1";
const TOKEN = import.meta.env.VITE_FINNHUB_KEY as string | undefined;

if (!TOKEN) {
  // Not throwing here—let UI handle it with a friendly message.
  console.warn("Missing VITE_FINNHUB_KEY in .env.local");
}

type FinnhubQuote = {
  c: number; // current
  d: number; // change
  dp: number; // change %
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp (sec)
};

export async function fetchQuote(symbol: string): Promise<Quote> {
  if (!TOKEN) {
    throw new Error("No API key set. Add VITE_FINNHUB_KEY in .env.local");
  }

  const url = `${API_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${TOKEN}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} while fetching ${symbol}`);
  }

  const data = (await res.json()) as FinnhubQuote;

  // Finnhub returns all zeros sometimes if symbol not found
  if (!data || (data.c === 0 && data.pc === 0)) {
    throw new Error(`No data for ${symbol}`);
  }

  return {
    symbol,
    price: data.c,
    change: data.d,
    changePct: data.dp,
    prevClose: data.pc,
    high: data.h,
    low: data.l,
    open: data.o,
    updatedAt: data.t,
  };
}

export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  const jobs = symbols.map((s) =>
    fetchQuote(s).catch((err) => {
      // keep the app responsive—return a flagged row instead of killing the whole batch
      return {
        symbol: s,
        price: NaN,
        change: NaN,
        changePct: NaN,
        prevClose: NaN,
        high: NaN,
        low: NaN,
        open: NaN,
        updatedAt: 0,

        _error: err instanceof Error ? err.message : String(err),
      } as Quote & { _error?: string };
    })
  );
  return Promise.all(jobs);
}