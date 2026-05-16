import { useEffect, useState } from "react";
import { X, Star } from "lucide-react";
import type { Linkage } from "@/lib/ecolink/types";
import { useStore } from "@/lib/ecolink/store";
import { ActorBadge, Chip, ScoreBar, StatusPill } from "./atoms";

interface Props {
  linkage: Linkage | null;
  onClose: () => void;
}

export function MatchReviewPanel({ linkage, onClose }: Props) {
  const { profiles, actorTypes, linkages, updateLinkage } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (linkage) {
      setMounted(true);
    }
  }, [linkage]);

  if (!linkage) return null;

  const a = profiles.find((p) => p.id === linkage.actorA);
  const b = profiles.find((p) => p.id === linkage.actorB);
  if (!a || !b) return null;
  const ta = actorTypes.find((t) => t.id === a.actorTypeId);
  const tb = actorTypes.find((t) => t.id === b.actorTypeId);

  const historyFor = (profileId: string) => {
    const past = linkages.filter(
      (l) => l.status === "completed" && (l.actorA === profileId || l.actorB === profileId) && l.outcomeScore
    );
    if (past.length === 0) return null;
    const avg = past.reduce((s, l) => s + (l.outcomeScore || 0), 0) / past.length;
    return { count: past.length, avg };
  };

  const histA = historyFor(a.id);
  const histB = historyFor(b.id);

  const close = () => {
    setMounted(false);
    setTimeout(onClose, 200);
  };

  const renderHistory = (label: string, hist: { count: number; avg: number } | null) =>
    hist ? (
      <p className="text-xs text-muted-foreground">
        This {label} has {hist.count} past linkage{hist.count > 1 ? "s" : ""} averaging{" "}
        <span className="text-foreground font-medium">{hist.avg.toFixed(1)} / 5</span>
      </p>
    ) : (
      <p className="text-xs text-muted-foreground italic">
        No outcome history yet — match is based on profile similarity only
      </p>
    );

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-200 ${mounted ? "opacity-100" : "opacity-0"}`}
        onClick={close}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-xl border-l border-border bg-surface shadow-2xl transition-transform duration-200 ease-in-out ${mounted ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Match Review</div>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-2xl font-semibold">{linkage.matchScore}%</span>
                <StatusPill status={linkage.status} />
              </div>
            </div>
            <button
              onClick={close}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 pt-4">
            <ScoreBar score={linkage.matchScore} />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { p: a, t: ta, hist: histA },
                { p: b, t: tb, hist: histB },
              ].map(({ p, t, hist }) => (
                <div key={p.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{p.name}</h3>
                    <ActorBadge type={t} />
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1">
                    {p.domainTags.map((d) => (
                      <Chip key={d}>{d}</Chip>
                    ))}
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">{p.bio}</p>
                  {renderHistory(t?.name.toLowerCase() || "participant", hist)}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                AI Rationale
              </h4>
              <p className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed">
                {linkage.matchRationale}
              </p>
            </div>

            {linkage.status === "completed" && (
              <div className="mt-6">
                <h4 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Outcome Score
                </h4>
                <StarRating
                  value={linkage.outcomeScore ?? 0}
                  onChange={(v) => updateLinkage(linkage.id, { outcomeScore: v })}
                />
              </div>
            )}
          </div>

          {linkage.status === "proposed" && (
            <div className="flex gap-2 border-t border-border px-6 py-4">
              <button
                onClick={() => {
                  updateLinkage(linkage.id, { status: "approved" });
                  close();
                }}
                className="flex-1 rounded-md border border-[color:var(--score-good)] px-4 py-2 text-sm font-medium text-[color:var(--score-good)] hover:bg-[color:var(--score-good)]/10"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  updateLinkage(linkage.id, { status: "rejected" });
                  close();
                }}
                className="flex-1 rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={(e) => {
            e.stopPropagation();
            onChange(n);
          }}
          className="rounded p-0.5 transition-transform hover:scale-110"
          aria-label={`Rate ${n}`}
        >
          <Star
            className="h-5 w-5"
            fill={n <= value ? "var(--score-mid)" : "transparent"}
            color={n <= value ? "var(--score-mid)" : "var(--muted-foreground)"}
          />
        </button>
      ))}
    </div>
  );
}
