type Point = {
  timestamp: string | Date;
  close: number;
};

interface PricePlotProps {
  points: Point[];
  height?: number;
  lastUpdated?: string | null;
}

const width = 600;

export function PricePlot({ points, height = 220, lastUpdated }: PricePlotProps) {
  if (!points.length) {
    return <p className="text-sm text-muted">No prices yet – pick a symbol.</p>;
  }

  const closes = points.map((p) => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const diff = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const timestamps = points.map((point) => new Date(point.timestamp));
  const labelFormat = (date: Date) => date.toLocaleDateString('en-US', { month: "short", day: "numeric" });
  const xLabels = [timestamps[0], timestamps[Math.floor(timestamps.length / 2)], timestamps[timestamps.length - 1]];

  const polylinePoints = points
    .map((point, index) => {
      const x = index * step;
      const normalized = (point.close - min) / diff;
      const y = height - normalized * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full space-y-2">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="url(#lineGradient)" strokeWidth="3" points={polylinePoints} />
        {xLabels.map((_, idx) => {
          const x = (idx === 0 ? 0 : idx === 1 ? width / 2 : width) - 0.5;
          return <line key={idx} x1={x} y1={0} x2={x} y2={height} stroke="rgba(148, 163, 184, 0.08)" />;
        })}
        <line x1={0} y1={height} x2={width} y2={height} stroke="rgba(148, 163, 184, 0.2)" />
      </svg>
      <div className="flex justify-between text-xs text-muted">
        <span>Low ${min.toFixed(2)}</span>
        <span>High ${max.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-[11px] text-muted">
        {xLabels.map((date, idx) => (
          <span key={idx}>{labelFormat(date)}</span>
        ))}
      </div>
      {lastUpdated ? (
        <p className="text-[11px] text-slate-400">Updated {new Date(lastUpdated).toLocaleTimeString()}</p>
      ) : null}
    </div>
  );
}
