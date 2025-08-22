import React from "react";
import StocksTable from "./components/StocksTable";
import { fetchQuotes } from "./lib/finnhub";

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN"];

type SortKey = "symbol" | "price" | "change" | "changePct" | "prevClose" | "range";
type SortDir = "asc" | "desc";

export default function App() {
  const [symbols, setSymbols] = React.useState<string[]>(DEFAULT_SYMBOLS);
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [refreshedAt, setRefreshedAt] = React.useState<Date | null>(null);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const keyMissing = !import.meta.env.VITE_FINNHUB_KEY;

  const [sortKey, setSortKey] = React.useState<SortKey>("symbol");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  function onSort(k: SortKey) {
    setSortKey((prev) => {
      if (prev === k) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return k;
    });
  }

  function sortedRows() {
    const copy = [...rows];
    copy.sort((a, b) => {
      const get = (x: any) => {
        if (sortKey === "range") return [x.low, x.high]; // sort by span then high
        return x[sortKey];
      };

      let av = get(a);
      let bv = get(b);

      // Handle NaNs last
      const aBad = Number.isNaN(a.price);
      const bBad = Number.isNaN(b.price);
      if (aBad && !bBad) return 1;
      if (!aBad && bBad) return -1;

      // symbol as string; others numeric
      let cmp = 0;
      if (sortKey === "symbol") {
        cmp = String(av).localeCompare(String(bv));
      } else if (sortKey === "range") {
        const [al, ah] = av as [number, number];
        const [bl, bh] = bv as [number, number];
        const aspan = ah - al;
        const bspan = bh - bl;
        cmp = aspan === bspan ? ah - bh : aspan - bspan;
      } else {
        cmp = (av as number) - (bv as number);
      }

      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }

  async function load() {
    setLoading(true);
    setApiError(null);
    try {
      const data = await fetchQuotes(symbols);
      setRows(data);
      setRefreshedAt(new Date());
    } catch (err) {
      setApiError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(",")]);

  function onAddSymbol(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.symbol as HTMLInputElement;
    const sym = input.value.trim().toUpperCase();
    if (sym && !symbols.includes(sym)) {
      setSymbols((s) => [...s, sym]);
    }
    input.value = "";
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Stock Dash</h1>
        <p className="text-sm text-gray-600">
          Simple, fast watchlist powered by Finnhub.
        </p>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 pb-10">
        {keyMissing && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Add your Finnhub key in <code>.env.local</code> as{" "}
            <code>VITE_FINNHUB_KEY=...</code>, then restart <code>npm run dev</code>.
          </div>
        )}

        <form
          onSubmit={onAddSymbol}
          className="flex items-center gap-2 rounded-xl border bg-white p-3 shadow-sm"
        >
          <input
            name="symbol"
            placeholder="Add symbol (e.g., TSLA)"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
          />
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            disabled={loading}
          >
            Add
          </button>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            disabled={loading}
          >
            Refresh
          </button>
        </form>

        {apiError && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        <StocksTable
          rows={sortedRows()}
          loading={loading}
          refreshedAt={refreshedAt}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
        />
      </main>
    </div>
  );
}