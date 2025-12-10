interface SectionCardProps {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SectionCard({ id, title, description, children }: SectionCardProps) {
  return (
    <section id={id} className="card rounded-3xl p-6 space-y-3">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
