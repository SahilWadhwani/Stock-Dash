#  Stock Dash

A simple, responsive stock price dashboard built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. It fetches **live stock quotes from Finnhub** and shows **7-day sparkline charts** using Yahoo Finance (via a serverless proxy).

---

##  Demo

- [Live App on Vercel](https://stock-dash-762p-74ak2h38j-sahilwadhwanis-projects.vercel.app)

---

##  Features

- **Core functionality**
  - Fetches and displays stock data in a table (symbol, price, change, % change, prev close, range).
  - Responsive layout styled with Tailwind CSS.

- **Additional features**
  - **Loading state** with spinner.
  - **Sorting** by clicking table headers (ascending/descending).
  - **Search and add** new stock symbols dynamically.
  - **Robust error handling** for both global and per-symbol errors.
  - **7-day sparkline chart** for each stock using Chart.js.
  - **Serverless proxy** for Yahoo Finance history to resolve CORS issues.

---

## Tech Stack

- [React + TypeScript + Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js + react-chartjs-2](https://react-chartjs-2.js.org/)
- [Finnhub API](https://finnhub.io/) (for live quotes)
- [Yahoo Finance Chart API](https://query1.finance.yahoo.com/) (for sparklines, accessed via proxy)
- [Vercel](https://vercel.com/) (for deployment and serverless functions)

---

##  Setup (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/SahilWadhwani/Stock-Dash.git
cd Stock-Dash

# 2. Install dependencies
npm install

# 3. Add your Finnhub API key
echo "VITE_FINNHUB_KEY=your_api_key_here" > .env.local

# 4. Run the development server
npm run dev
# Visit http://localhost:5173 in your browser
````

-----

##  Deployment (Vercel)

  - Add your `VITE_FINNHUB_KEY` to **Project Settings → Environment Variables**.
  - The Yahoo proxy is handled by `api/yf-proxy.js` with a rewrite rule in `vercel.json` to route requests:

<!-- end list -->

```json
{
  "rewrites": [
    {
      "source": "/yf-api/(.*)",
      "destination": "/api/yf-proxy/$1"
    }
  ]
}
```

> **Note:** The Yahoo Finance endpoint does not require an API key.

-----

##  Important Notes

  - The Finnhub free plan has a rate limit of 60 API calls per minute. The app handles rate limit errors gracefully.
  - The Yahoo Finance endpoint is undocumented, so it is accessed via a serverless proxy to bypass Cross-Origin Resource Sharing (CORS) restrictions.
  - A synthetic fallback is implemented to ensure sparkline charts never appear as empty gaps.

-----

##  Author

Sahil Wadhwani
