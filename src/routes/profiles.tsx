import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, X } from "lucide-react";
import { uid, useProgrammeScoped } from "@/lib/ecolink/store";
import type { Linkage, Profile } from "@/lib/ecolink/types";
import { ActorBadge, Chip } from "@/components/ecolink/atoms";

export const Route = createFileRoute("/profiles")({
  head: () => ({
    meta: [
      { title: "Profiles — EcoLink" },
      { name: "description", content: "Manage participants and run AI matching." },
    ],
  }),
  component: ProfilesPage,
});

function ProfilesPage() {
  const store = useProgrammeScoped();
  const { pProfiles, pActorTypes, programme, addLinkages, pTemplates } = store;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [matching, setMatching] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return pProfiles.filter((p) => {
      if (typeFilter.size && !typeFilter.has(p.actorTypeId)) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [pProfiles, search, typeFilter]);

  const runMatching = async () => {
    if (!lastAddedId) {
      toast.error("Add a participant first, then run matching.");
      return;
    }
    const newProfile = pProfiles.find((p) => p.id === lastAddedId);
    const newType = newProfile && pActorTypes.find((t) => t.id === newProfile.actorTypeId);
    if (!newProfile || !newType) return;

    const oppositeRole = newType.roleCategory === "supply" ? "demand" : "supply";
    const oppositeTypes = pActorTypes.filter((t) => t.roleCategory === oppositeRole);
    const candidates = pProfiles.filter((p) => oppositeTypes.some((t) => t.id === p.actorTypeId));
    if (candidates.length === 0) {
      toast.error(`No ${oppositeRole}-side candidates available.`);
      return;
    }

    setMatching(true);
    try {
      const typeName = (id: string) => pActorTypes.find((t) => t.id === id)?.name ?? "Unknown";
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programme: { name: programme.name, theme: programme.theme },
          source: {
            name: newProfile.name,
            actorType: newType.name,
            roleCategory: newType.roleCategory,
            domainTags: newProfile.domainTags,
            bio: newProfile.bio,
          },
          candidates: candidates.map((c) => ({
            id: c.id,
            name: c.name,
            actorType: typeName(c.actorTypeId),
            domainTags: c.domainTags,
            bio: c.bio,
          })),
        }),
      });

      if (!res.ok) {
        if (res.status === 429) toast.error("AI rate limit reached. Try again shortly.");
        else if (res.status === 402) toast.error("AI credits exhausted. Add credits in Workspace settings.");
        else toast.error("AI matching failed.");
        setMatching(false);
        return;
      }

      const data = (await res.json()) as {
        matches: { candidateId: string; score: number; rationale: string }[];
      };
      const top = [...data.matches].sort((a, b) => b.score - a.score).slice(0, 2);

      const template = pTemplates[0];
      const isSupplyNew = newType.roleCategory === "supply";
      const newLinkages: Linkage[] = top
        .map((m) => {
          const cand = candidates.find((c) => c.id === m.candidateId);
          if (!cand) return null;
          return {
            id: uid("lk"),
            programmeId: programme.id,
            templateId: template?.id ?? "",
            actorA: isSupplyNew ? newProfile.id : cand.id,
            actorB: isSupplyNew ? cand.id : newProfile.id,
            matchScore: Math.round(m.score),
            matchRationale: m.rationale,
            status: "proposed" as const,
            outcomeScore: null,
          } satisfies Linkage;
        })
        .filter((l) => l !== null) as Linkage[];

      addLinkages(newLinkages);
      toast.success(`${newLinkages.length} new AI-proposed match${newLinkages.length === 1 ? "" : "es"}.`);
    } catch {
      toast.error("AI matching failed.");
    } finally {
      setMatching(false);
    }
  };

  const toggleType = (id: string) => {
    setTypeFilter((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profiles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pProfiles.length} participant{pProfiles.length === 1 ? "" : "s"} in {programme.name}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add Participant
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-72 rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {pActorTypes.map((t) => {
            const active = typeFilter.has(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggleType(t.id)}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-opacity"
                style={{
                  backgroundColor: `${t.color}${active ? "44" : "22"}`,
                  color: t.color,
                  boxShadow: `inset 0 0 0 1px ${t.color}${active ? "aa" : "55"}`,
                }}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Actor Type</th>
              <th className="px-4 py-3 text-left font-medium">Domain Tags</th>
              <th className="px-4 py-3 text-left font-medium">Embedding</th>
              <th className="px-4 py-3 text-left font-medium">Date Added</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const t = pActorTypes.find((a) => a.id === p.actorTypeId);
              return (
                <tr key={p.id} className="border-t border-border/60 hover:bg-surface-hover/50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3"><ActorBadge type={t} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.domainTags.slice(0, 3).map((d) => <Chip key={d}>{d}</Chip>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${p.embeddingStatus === "ready" ? "text-[color:var(--score-good)]" : "text-[color:var(--score-mid)]"}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {p.embeddingStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.dateAdded).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">No participants match.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <button
          onClick={runMatching}
          disabled={matching}
          className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
        >
          {matching ? "Finding best matches…" : "Run Matching"}
        </button>
      </div>

      {showAdd && (
        <AddProfileModal
          onClose={() => setShowAdd(false)}
          onAdded={(p) => setLastAddedId(p.id)}
        />
      )}
    </div>
  );
}

function AddProfileModal({ onClose, onAdded }: { onClose: () => void; onAdded: (p: Profile) => void }) {
  const { pActorTypes, programme, addProfile } = useProgrammeScoped();
  const [name, setName] = useState("");
  const [actorTypeId, setActorTypeId] = useState(pActorTypes[0]?.id ?? "");
  const [bio, setBio] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const addTag = (raw: string) => {
    const v = raw.trim().replace(/,$/, "");
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !actorTypeId) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 2000));
    const profile: Profile = {
      id: uid("pf"),
      name,
      programmeId: programme.id,
      actorTypeId,
      domainTags: tags,
      bio,
      embeddingStatus: "ready",
      dateAdded: new Date().toISOString(),
    };
    addProfile(profile);
    onAdded(profile);
    toast.success("Profile added and embedding ready.");
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={submit} className="relative w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Participant</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-surface-hover">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </Field>
          <Field label="Actor Type">
            <select value={actorTypeId} onChange={(e) => setActorTypeId(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
              {pActorTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Domain Tags">
            <div className="rounded-md border border-border bg-background px-2 py-1.5">
              <div className="mb-1 flex flex-wrap gap-1">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded bg-accent px-2 py-0.5 text-xs">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="text-muted-foreground hover:text-foreground">×</button>
                  </span>
                ))}
              </div>
              <input
                value={tagInput}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.endsWith(",")) addTag(v);
                  else setTagInput(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); }
                }}
                placeholder="Type a tag and press Enter"
                className="w-full bg-transparent py-1 text-sm outline-none"
              />
            </div>
          </Field>
          <Field label="Bio">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-surface-hover">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {saving ? "Generating embedding…" : "Save & Generate Embedding"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
