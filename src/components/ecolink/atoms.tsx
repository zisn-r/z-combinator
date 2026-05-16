import type { ActorType } from "@/lib/ecolink/types";

export function ActorBadge({ type }: { type?: ActorType }) {
  if (!type) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: `${type.color}26`,
        color: type.color,
        boxShadow: `inset 0 0 0 1px ${type.color}55`,
      }}
    >
      {type.name}
    </span>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const color = score > 80 ? "var(--score-good)" : score >= 60 ? "var(--score-mid)" : "var(--score-low)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: `color-mix(in oklab, var(--status-${status}) 18%, transparent)`,
        color: `var(--status-${status})`,
      }}
    >
      {label}
    </span>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}
