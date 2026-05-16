import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useProgrammeScoped } from "@/lib/ecolink/store";
import type { Linkage, LinkageStatus } from "@/lib/ecolink/types";
import { ActorBadge, ScoreBar, StatusPill } from "@/components/ecolink/atoms";
import { MatchReviewPanel, StarRating } from "@/components/ecolink/MatchReviewPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — EcoLink" },
      { name: "description", content: "Track every relationship through its full lifecycle." },
    ],
  }),
  component: Dashboard,
});

const columns: { status: LinkageStatus; label: string }[] = [
  { status: "proposed", label: "Proposed" },
  { status: "approved", label: "Approved" },
  { status: "active", label: "Active" },
  { status: "completed", label: "Completed" },
];

function Dashboard() {
  const { pLinkages, programme } = useProgrammeScoped();
  const [open, setOpen] = useState<Linkage | null>(null);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Linkages in <span className="text-foreground">{programme.name}</span>
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {pLinkages.length} linkage{pLinkages.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => {
          const items = pLinkages.filter((l) => l.status === col.status);
          return (
            <div key={col.status} className="flex flex-col rounded-xl border border-border bg-surface/40 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <StatusPill status={col.status} />
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                    Empty
                  </div>
                )}
                {items.map((l) => (
                  <LinkageCard key={l.id} linkage={l} onOpen={() => setOpen(l)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <MatchReviewPanel linkage={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function LinkageCard({ linkage, onOpen }: { linkage: Linkage; onOpen: () => void }) {
  const { profiles, actorTypes, programmes, updateLinkage } = useProgrammeScoped();
  const a = profiles.find((p) => p.id === linkage.actorA);
  const b = profiles.find((p) => p.id === linkage.actorB);
  const ta = actorTypes.find((t) => t.id === a?.actorTypeId);
  const tb = actorTypes.find((t) => t.id === b?.actorTypeId);
  const prog = programmes.find((p) => p.id === linkage.programmeId);
  if (!a || !b) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 hover:bg-surface-hover hover:shadow-lg"
    >
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{a.name}</span>
          <ActorBadge type={ta} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{b.name}</span>
          <ActorBadge type={tb} />
        </div>
      </div>

      <ScoreBar score={linkage.matchScore} />

      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{linkage.matchRationale}</p>

      <div className="mt-3 text-[11px] text-muted-foreground/70">{prog?.name}</div>

      <div className="mt-3 flex gap-2" onClick={stop}>
        {linkage.status === "proposed" && (
          <>
            <button
              onClick={() => updateLinkage(linkage.id, { status: "approved" })}
              className="flex-1 rounded-md border border-[color:var(--score-good)] px-2 py-1 text-xs font-medium text-[color:var(--score-good)] hover:bg-[color:var(--score-good)]/10"
            >
              Approve
            </button>
            <button
              onClick={() => updateLinkage(linkage.id, { status: "rejected" })}
              className="flex-1 rounded-md border border-destructive px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              Reject
            </button>
          </>
        )}
        {linkage.status === "approved" && (
          <button
            onClick={() => updateLinkage(linkage.id, { status: "active" })}
            className="flex-1 rounded-md border border-[color:var(--status-active)] px-2 py-1 text-xs font-medium text-[color:var(--status-active)] hover:bg-[color:var(--status-active)]/10"
          >
            Activate
          </button>
        )}
        {linkage.status === "active" && (
          <button
            onClick={() => updateLinkage(linkage.id, { status: "completed" })}
            className="flex-1 rounded-md border border-[color:var(--status-completed)] px-2 py-1 text-xs font-medium text-[color:var(--status-completed)] hover:bg-[color:var(--status-completed)]/10"
          >
            Mark Complete
          </button>
        )}
        {linkage.status === "completed" && (
          <StarRating
            value={linkage.outcomeScore ?? 0}
            onChange={(v) => updateLinkage(linkage.id, { outcomeScore: v })}
          />
        )}
      </div>
    </div>
  );
}
