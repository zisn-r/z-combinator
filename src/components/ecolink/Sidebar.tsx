import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, FolderKanban, BarChart3, Sparkles } from "lucide-react";
import { useStore } from "@/lib/ecolink/store";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profiles", label: "Profiles", icon: Users },
  { to: "/programmes", label: "Programmes", icon: FolderKanban },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function Sidebar() {
  const { programmes, selectedProgrammeId, setSelectedProgrammeId } = useStore();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-semibold leading-tight">EcoLink</div>
          <div className="text-[11px] text-muted-foreground">Relationship OS</div>
        </div>
      </div>

      <div className="px-3 pb-3">
        <label className="mb-1 block px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          Programme
        </label>
        <select
          value={selectedProgrammeId}
          onChange={(e) => setSelectedProgrammeId(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <nav className="mt-2 flex flex-col gap-1 px-3">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = pathname === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1.5 h-[calc(100%-12px)] w-[3px] rounded-r bg-primary" />
              )}
              <Icon className="h-4 w-4" />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 text-[11px] text-muted-foreground/70">
        Hackathon demo · AI simulated
      </div>
    </aside>
  );
}
