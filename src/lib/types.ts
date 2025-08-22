export type Quote = {
  symbol: string;
  price: number;       // current price
  change: number;      // absolute change
  changePct: number;   // percent change
  prevClose: number;   // previous close
  high: number;
  low: number;
  open: number;
  updatedAt: number;   // unix epoch (sec)
};