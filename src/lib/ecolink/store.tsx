import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ActorType, Linkage, LinkageStatus, LinkageTemplate, Profile, Programme } from "./types";
import { seedActorTypes, seedLinkages, seedProfiles, seedProgrammes, seedTemplates } from "./seed";

let _id = 1000;
export const uid = (prefix = "id") => `${prefix}-${++_id}-${Math.random().toString(36).slice(2, 6)}`;

interface StoreCtx {
  programmes: Programme[];
  actorTypes: ActorType[];
  templates: LinkageTemplate[];
  profiles: Profile[];
  linkages: Linkage[];
  selectedProgrammeId: string;
  setSelectedProgrammeId: (id: string) => void;
  addProfile: (p: Profile) => void;
  addLinkages: (ls: Linkage[]) => void;
  updateLinkage: (id: string, patch: Partial<Linkage>) => void;
  addProgramme: (p: Programme, types: ActorType[], tpl: LinkageTemplate) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function EcoLinkProvider({ children }: { children: ReactNode }) {
  const [programmes, setProgrammes] = useState<Programme[]>(seedProgrammes);
  const [actorTypes, setActorTypes] = useState<ActorType[]>(seedActorTypes);
  const [templates, setTemplates] = useState<LinkageTemplate[]>(seedTemplates);
  const [profiles, setProfiles] = useState<Profile[]>(seedProfiles);
  const [linkages, setLinkages] = useState<Linkage[]>(seedLinkages);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>(seedProgrammes[0].id);

  const value = useMemo<StoreCtx>(
    () => ({
      programmes,
      actorTypes,
      templates,
      profiles,
      linkages,
      selectedProgrammeId,
      setSelectedProgrammeId,
      addProfile: (p) => setProfiles((s) => [...s, p]),
      addLinkages: (ls) => setLinkages((s) => [...s, ...ls]),
      updateLinkage: (id, patch) =>
        setLinkages((s) => s.map((l) => (l.id === id ? { ...l, ...patch } : l))),
      addProgramme: (p, types, tpl) => {
        setProgrammes((s) => [...s, p]);
        setActorTypes((s) => [...s, ...types]);
        setTemplates((s) => [...s, tpl]);
      },
    }),
    [programmes, actorTypes, templates, profiles, linkages, selectedProgrammeId]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used within EcoLinkProvider");
  return c;
}

// Helpers
export function useProgrammeScoped() {
  const s = useStore();
  const pid = s.selectedProgrammeId;
  return {
    ...s,
    programme: s.programmes.find((p) => p.id === pid)!,
    pActorTypes: s.actorTypes.filter((a) => a.programmeId === pid),
    pTemplates: s.templates.filter((t) => t.programmeId === pid),
    pProfiles: s.profiles.filter((p) => p.programmeId === pid),
    pLinkages: s.linkages.filter((l) => l.programmeId === pid),
  };
}

export function scoreColor(score: number): string {
  if (score > 80) return "var(--score-good)";
  if (score >= 60) return "var(--score-mid)";
  return "var(--score-low)";
}

export function statusColorVar(s: LinkageStatus): string {
  return `var(--status-${s})`;
}
