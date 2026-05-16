import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { uid, useStore } from "@/lib/ecolink/store";
import type { ActorType, LinkageTemplate, Programme, RoleCategory } from "@/lib/ecolink/types";
import { Field } from "./profiles";

export const Route = createFileRoute("/programmes")({
  head: () => ({
    meta: [
      { title: "Programmes — EcoLink" },
      { name: "description", content: "Configure programmes, actor types, and linkage templates." },
    ],
  }),
  component: ProgrammesPage,
});

const PRESET_COLORS = ["#B45309", "#0F6E56", "#534AB7", "#993C1D", "#185FA5", "#A41E68"];

function ProgrammesPage() {
  const { programmes, actorTypes, templates, profiles, linkages } = useStore();
  const [wizard, setWizard] = useState(false);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Programmes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Define participant types and relationship rules.</p>
        </div>
        <button
          onClick={() => setWizard(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Programme
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {programmes.map((p) => {
          const tpl = templates.find((t) => t.id === p.templateId);
          const types = actorTypes.filter((a) => a.programmeId === p.id);
          const pCount = profiles.filter((f) => f.programmeId === p.id).length;
          const lCount = linkages.filter((l) => l.programmeId === p.id).length;
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lg">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-muted-foreground">{p.theme}</span>
              </div>
              <div className="mb-4 text-xs text-muted-foreground">
                {p.country} · {p.year}
              </div>

              <div className="mb-4 flex flex-wrap gap-1">
                {types.map((t) => (
                  <span key={t.id} className="rounded-full px-2 py-0.5 text-[11px]"
                    style={{ backgroundColor: `${t.color}26`, color: t.color, boxShadow: `inset 0 0 0 1px ${t.color}55` }}>
                    {t.name}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <Stat label="Participants" value={pCount} />
                <Stat label="Linkages" value={lCount} />
                <Stat label="Types" value={types.length} />
              </div>

              {tpl && (
                <div className="mt-3 rounded-md bg-surface px-3 py-2 text-xs text-muted-foreground">
                  Template: <span className="text-foreground">{tpl.name}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {wizard && <ProgrammeWizard onClose={() => setWizard(false)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

interface DraftType { name: string; role: RoleCategory; color: string; }

function ProgrammeWizard({ onClose }: { onClose: () => void }) {
  const { addProgramme } = useStore();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [theme, setTheme] = useState("");
  const [country, setCountry] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const [types, setTypes] = useState<DraftType[]>([
    { name: "", role: "supply", color: PRESET_COLORS[0] },
    { name: "", role: "demand", color: PRESET_COLORS[1] },
  ]);

  const [tplName, setTplName] = useState("");
  const [supplyIdx, setSupplyIdx] = useState(0);
  const [demandIdx, setDemandIdx] = useState(1);
  const [maxPer, setMaxPer] = useState(3);

  const supplyTypes = types.map((t, i) => ({ t, i })).filter(({ t }) => t.role === "supply");
  const demandTypes = types.map((t, i) => ({ t, i })).filter(({ t }) => t.role === "demand");

  const canNext1 = name && theme && country && year;
  const canNext2 = types.length >= 2 && types.every((t) => t.name.trim().length > 0);
  const canCreate = tplName && supplyTypes.length > 0 && demandTypes.length > 0 && maxPer > 0;

  const create = () => {
    const progId = uid("prog");
    const tplId = uid("tpl");
    const programme: Programme = { id: progId, name, theme, country, year: Number(year), templateId: tplId };
    const builtTypes: ActorType[] = types.map((t) => ({
      id: uid("at"),
      programmeId: progId,
      name: t.name,
      roleCategory: t.role,
      color: t.color,
    }));
    const supplyOrigIdx = supplyTypes[0]?.i ?? 0;
    const demandOrigIdx = demandTypes[0]?.i ?? 1;
    const supA = builtTypes[supplyOrigIdx];
    const demB = builtTypes[demandOrigIdx];
    const template: LinkageTemplate = {
      id: tplId,
      name: tplName,
      programmeId: progId,
      actorTypeA: supA.id,
      actorTypeB: demB.id,
      maxPerActor: Number(maxPer),
    };
    addProgramme(programme, builtTypes, template);
    toast.success(`Programme "${name}" created.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">New Programme</h2>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {[1, 2, 3].map((s) => (
                <span key={s} className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${step === s ? "bg-primary text-primary-foreground" : step > s ? "bg-accent text-foreground" : "bg-surface-hover"}`}>{s}</span>
              ))}
              <span className="ml-2">Step {step} of 3</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-surface-hover">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <Field label="Programme name">
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="Theme">
              <input value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Country">
                <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </Field>
              <Field label="Year">
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {types.map((t, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                <input
                  value={t.name}
                  onChange={(e) => setTypes(types.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                  placeholder="Type name"
                  className="flex-1 bg-transparent px-2 py-1 text-sm outline-none"
                />
                <select
                  value={t.role}
                  onChange={(e) => setTypes(types.map((x, idx) => idx === i ? { ...x, role: e.target.value as RoleCategory } : x))}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                >
                  <option value="supply">Supply</option>
                  <option value="demand">Demand</option>
                  <option value="neutral">Neutral</option>
                </select>
                <div className="flex gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTypes(types.map((x, idx) => idx === i ? { ...x, color: c } : x))}
                      className="h-5 w-5 rounded-full ring-offset-2 ring-offset-surface"
                      style={{
                        backgroundColor: c,
                        boxShadow: t.color === c ? `0 0 0 2px var(--foreground)` : "none",
                      }}
                    />
                  ))}
                </div>
                {types.length > 2 && (
                  <button type="button" onClick={() => setTypes(types.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setTypes([...types, { name: "", role: "supply", color: PRESET_COLORS[types.length % PRESET_COLORS.length] }])}
              className="text-xs text-primary hover:underline"
            >
              + Add another type
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Field label="Template name">
              <input value={tplName} onChange={(e) => setTplName(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="Who gets assigned?">
              <select value={supplyIdx} onChange={(e) => setSupplyIdx(Number(e.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {supplyTypes.map(({ t, i }) => <option key={i} value={i}>{t.name}</option>)}
                {supplyTypes.length === 0 && <option>— Define a supply type in step 2 —</option>}
              </select>
            </Field>
            <Field label="Who receives the assignment?">
              <select value={demandIdx} onChange={(e) => setDemandIdx(Number(e.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {demandTypes.map(({ t, i }) => <option key={i} value={i}>{t.name}</option>)}
                {demandTypes.length === 0 && <option>— Define a demand type in step 2 —</option>}
              </select>
            </Field>
            <Field label="Max per actor">
              <input type="number" min={1} value={maxPer} onChange={(e) => setMaxPer(Number(e.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </Field>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
            className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-surface-hover"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={create}
              disabled={!canCreate}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Create Programme
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
