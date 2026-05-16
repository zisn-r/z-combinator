export type RoleCategory = "supply" | "demand" | "neutral";
export type LinkageStatus = "proposed" | "approved" | "active" | "completed" | "rejected";

export interface ActorType {
  id: string;
  programmeId: string;
  name: string;
  roleCategory: RoleCategory;
  color: string;
}

export interface Profile {
  id: string;
  name: string;
  programmeId: string;
  actorTypeId: string;
  domainTags: string[];
  bio: string;
  embeddingStatus: "ready" | "pending";
  dateAdded: string;
}

export interface Programme {
  id: string;
  name: string;
  theme: string;
  country: string;
  year: number;
  templateId: string;
}

export interface LinkageTemplate {
  id: string;
  name: string;
  programmeId: string;
  actorTypeA: string;
  actorTypeB: string;
  maxPerActor: number;
}

export interface Linkage {
  id: string;
  programmeId: string;
  templateId: string;
  actorA: string;
  actorB: string;
  matchScore: number;
  matchRationale: string;
  status: LinkageStatus;
  outcomeScore: number | null;
}
