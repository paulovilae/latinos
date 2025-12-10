interface TagPillProps {
  label: string;
  tone?: "neutral" | "success" | "warning";
}

const toneClasses: Record<NonNullable<TagPillProps["tone"]>, string> = {
  neutral: "bg-slate-800 text-slate-200",
  success: "bg-emerald-900 text-emerald-200",
  warning: "bg-amber-900 text-amber-100",
};

export function TagPill({ label, tone = "neutral" }: TagPillProps) {
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${toneClasses[tone]}`}>{label}</span>;
}
