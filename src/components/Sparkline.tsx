import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
} from "chart.js";
import { fetchLastWeekCloses } from "../lib/history";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

type Props = {
  symbol: string;
  height?: number;
};

export default function Sparkline({ symbol, height = 36 }: Props) {
  const [points, setPoints] = React.useState<number[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        const c = await fetchLastWeekCloses(symbol);
        if (!alive) return;
        setPoints(c);
      } catch (e) {
        if (!alive) return;
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [symbol]);

  if (err) return <span className="text-xs text-gray-400">—</span>;
  if (!points) {
    return (
      <span className="inline-flex items-center justify-center text-gray-400 text-xs">
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
          <path d="M22 12a10 10 0 0 1-10 10" fill="currentColor"/>
        </svg>
      </span>
    );
  }

  const up = points[points.length - 1] >= points[0];

  // minimal dataset; axes & legend hidden in options
  const data = {
    labels: points.map((_, i) => i),
    datasets: [
      {
        data: points,
        tension: 0.3,
        borderWidth: 1.5,
        pointRadius: 0,
        
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      line: {
        borderColor: up ? undefined : undefined, 
      },
    },
  };

  
  return (
    <div
      className={`h-[${height}px] w-28 rounded-sm border ${
        up ? "border-green-500/50" : "border-red-500/50"
      }`}
    >
      <Line data={data} options={options} />
    </div>
  );
}