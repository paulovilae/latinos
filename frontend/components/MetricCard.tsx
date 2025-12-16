interface MetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
}

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="card rounded-2xl p-4 flex flex-col gap-1">
      <span className="text-muted text-sm">{label}</span>
      <strong className="text-2xl font-semibold">{value}</strong>
      {helper && <span className="text-xs text-muted">{helper}</span>}
    </div>
  );
}
