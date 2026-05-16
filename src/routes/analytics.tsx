import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useProgrammeScoped, useStore } from "@/lib/ecolink/store";
import { ActorBadge, Chip } from "@/components/ecolink/atoms";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — EcoLink" },
      { name: "description", content: "Outcome and matching analytics by programme." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { programme, pLinkages, pProfiles, pActorTypes } = useProgrammeScoped();
  const all = useStore();

  const completed = pLinkages.filter((l) => l.status === "completed" && l.outcomeScore);
  const avgOutcome = completed.length ? (completed.reduce((s, l) => s + (l.outcomeScore || 0), 0) / completed.length) : null;

  const domainMatchRate = useMemo(() => {
    if (pLinkages.length === 0) return 0;
    const matches = pLinkages.filter((l) => {
      const a = pProfiles.find((p) => p.id === l.actorA);
      const b = pProfiles.find((p) => p.id === l.actorB);
      if (!a || !b) return false;
      return a.domainTags.some((d) => b.domainTags.includes(d));
    }).length;
    return Math.round((matches / pLinkages.length) * 100);
  }, [pLinkages, pProfiles]);

  // Bar chart: avg outcome score per programme that has completed linkages
  const barData = useMemo(() => {
    return all.programmes
      .map((p) => {
        const cs = all.linkages.filter((l) => l.programmeId === p.id && l.status === "completed" && l.outcomeScore);
        if (cs.length === 0) return null;
        const avg = cs.reduce((s, l) => s + (l.outcomeScore || 0), 0) / cs.length;
        return { name: p.name, score: Number(avg.toFixed(2)) };
      })
      .filter(Boolean) as { name: string; score: number }[];
  }, [all.programmes, all.linkages]);

  // Top performers
  const supplyTypes = pActorTypes.filter((t) => t.roleCategory === "supply");
  const supplyLabel = supplyTypes[0]?.name ?? "Supply";

  const performers = useMemo(() => {
    return pProfiles
      .filter((p) => supplyTypes.some((t) => t.id === p.actorTypeId))
      .map((p) => {
        const linked = pLinkages.filter((l) => (l.actorA === p.id || l.actorB === p.id) && l.status === "completed" && l.outcomeScore);
        const avg = linked.length ? linked.reduce((s, l) => s + (l.outcomeScore || 0), 0) / linked.length : 0;
        return { profile: p, avg, count: linked.length };
      })
      .filter((x) => x.count > 0)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
  }, [pProfiles, pLinkages, supplyTypes]);

  const enoughData = completed.length >= 2;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Scoped to {programme.name}</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Average outcome score" value={avgOutcome !== null ? `${avgOutcome.toFixed(2)} / 5` : "—"} hint={`${completed.length} completed`} />
        <MetricCard label="Domain match rate" value={`${domainMatchRate}%`} hint="Shared domain on linkage" />
        <MetricCard label="Total linkages" value={pLinkages.length.toString()} hint="All statuses" />
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Average outcome score by programme</h3>
        {barData.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No completed linkages with outcome scores yet.</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[0, 5]} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="score" fill="var(--primary)" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="score" position="top" fill="var(--foreground)" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-medium">Top {supplyLabel}s by outcome score</h3>
        {!enoughData ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Not enough data yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2 text-left font-medium">Name</th>
                <th className="py-2 text-left font-medium">Actor Type</th>
                <th className="py-2 text-left font-medium">Domain Tags</th>
                <th className="py-2 text-left font-medium">Avg Score</th>
                <th className="py-2 text-left font-medium">Linkages</th>
              </tr>
            </thead>
            <tbody>
              {performers.map((row) => {
                const t = pActorTypes.find((a) => a.id === row.profile.actorTypeId);
                return (
                  <tr key={row.profile.id} className="border-t border-border/60">
                    <td className="py-2 font-medium">{row.profile.name}</td>
                    <td className="py-2"><ActorBadge type={t} /></td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {row.profile.domainTags.slice(0, 3).map((d) => <Chip key={d}>{d}</Chip>)}
                      </div>
                    </td>
                    <td className="py-2 font-semibold text-[color:var(--score-good)]">{row.avg.toFixed(2)}</td>
                    <td className="py-2 text-muted-foreground">{row.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
