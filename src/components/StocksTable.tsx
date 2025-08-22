import React from "react";
import type { Quote } from "../lib/types";
import { cn } from "../lib/cn";
import Sparkline from "./Sparkline";

type SortKey = "symbol" | "price" | "change" | "changePct" | "prevClose" | "range";
type SortDir = "asc" | "desc";

type Props = {
  rows: (Quote & { _error?: string })[];
  loading: boolean;
  refreshedAt?: Date | null;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
};

function Th({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  hideOnMd,
}: {
  label: string;
  k?: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  hideOnMd?: boolean;
}) {
  const sortable = !!k;
  const active = k && sortKey === k;
  return (
    <th
      className={cn(
        "px-4 py-2",
        sortable && "select-none cursor-pointer",
        hideOnMd && "hidden md:table-cell"
      )}
      onClick={sortable ? () => onSort(k!) : undefined}
      title={sortable ? "Click to sort" : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortable && (
          <span
            className={cn(
              "inline-block text-[10px] transition-transform",
              active ? "opacity-100" : "opacity-30"
            )}
          >
            {active ? (sortDir === "asc" ? "▲" : "▼") : "▲"}
          </span>
        )}
      </span>
    </th>
  );
}

export default function StocksTable({
  rows,
  loading,
  refreshedAt,
  sortKey,
  sortDir,
  onSort,
}: Props) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-medium tracking-tight">Watchlist</h2>
        {refreshedAt && (
          <span className="text-xs text-gray-500">
            Updated {refreshedAt.toLocaleTimeString()}
          </span>
        )}
      </div>

      <table className="min-w-[760px] w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <Th label="Symbol"     k="symbol"    sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            <Th label="Price"      k="price"     sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            <Th label="Change"     k="change"    sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            <Th label="% Change"   k="changePct" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            <Th label="Prev Close" k="prevClose" sortKey={sortKey} sortDir={sortDir} onSort={onSort} hideOnMd />
            <Th label="Day Range"  k="range"     sortKey={sortKey} sortDir={sortDir} onSort={onSort} hideOnMd />
            <Th label="7d"         sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                    <path d="M22 12a10 10 0 0 1-10 10" fill="currentColor"/>
                  </svg>
                  Loading quotes…
                </span>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>
                No symbols to show.
              </td>
            </tr>
          ) : (
            rows.map((q) => {
              const bad = Number.isNaN(q.price) || (q as any)._error;
              const sign =
                !bad && q.change !== 0
                  ? q.change > 0
                    ? "text-green-600"
                    : "text-red-600"
                  : "text-gray-700";
              return (
                <tr key={q.symbol} className="border-t">
                  <td className="px-4 py-2 font-medium">{q.symbol}</td>
                  <td className="px-4 py-2 tabular-nums">{bad ? "—" : q.price.toFixed(2)}</td>
                  <td className={cn("px-4 py-2 tabular-nums", sign)}>
                    {bad ? "—" : q.change.toFixed(2)}
                  </td>
                  <td className={cn("px-4 py-2 tabular-nums", sign)}>
                    {bad ? "—" : `${q.changePct.toFixed(2)}%`}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell tabular-nums">
                    {bad ? "—" : q.prevClose.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell tabular-nums">
                    {bad ? "—" : `${q.low.toFixed(2)} - ${q.high.toFixed(2)}`}
                  </td>
                  <td className="px-2 py-2">
                    {bad ? <span className="text-xs text-gray-400">—</span> : <Sparkline symbol={q.symbol} />}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {!loading && rows.some((r: any) => r._error) && (
        <div className="border-t bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Some symbols failed:{" "}
          {rows
            .filter((r: any) => r._error)
            .map((r: any) => `${r.symbol} (${r._error})`)
            .join(", ")}
        </div>
      )}
    </div>
  );
}