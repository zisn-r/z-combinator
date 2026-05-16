import type { ActorType, Linkage, LinkageTemplate, Profile, Programme } from "./types";

// Programme 1: MyHack 2026
const p1 = "prog-myhack-2026";
const at_judge = "at-judge";
const at_team = "at-team";
const tpl_hack = "tpl-hack-eval";

// Programme 2: Cradle Accelerator
const p2 = "prog-cradle-2026";
const at_mentor = "at-mentor";
const at_startup = "at-startup";
const at_partner = "at-partner";
const tpl_acc = "tpl-accel-mentor";

export const seedProgrammes: Programme[] = [
  { id: p1, name: "MyHack 2026", theme: "Web Development", country: "Malaysia", year: 2026, templateId: tpl_hack },
  { id: p2, name: "Cradle Accelerator 2026", theme: "Deep Tech", country: "Malaysia", year: 2026, templateId: tpl_acc },
];

export const seedActorTypes: ActorType[] = [
  { id: at_judge, programmeId: p1, name: "Judge", roleCategory: "supply", color: "#B45309" },
  { id: at_team, programmeId: p1, name: "Team", roleCategory: "demand", color: "#0F6E56" },
  { id: at_mentor, programmeId: p2, name: "Mentor", roleCategory: "supply", color: "#534AB7" },
  { id: at_startup, programmeId: p2, name: "Startup", roleCategory: "demand", color: "#993C1D" },
  { id: at_partner, programmeId: p2, name: "Corporate Partner", roleCategory: "neutral", color: "#185FA5" },
];

export const seedTemplates: LinkageTemplate[] = [
  { id: tpl_hack, name: "Hackathon Evaluation", programmeId: p1, actorTypeA: at_judge, actorTypeB: at_team, maxPerActor: 3 },
  { id: tpl_acc, name: "Accelerator Mentorship", programmeId: p2, actorTypeA: at_mentor, actorTypeB: at_startup, maxPerActor: 2 },
];

const today = new Date().toISOString();

export const seedProfiles: Profile[] = [
  { id: "pf-priya", name: "Priya Nair", programmeId: p1, actorTypeId: at_judge, domainTags: ["UI/UX", "Frontend", "Product"], bio: "Design lead at a fintech unicorn, mentored 20+ hackathon teams", embeddingStatus: "ready", dateAdded: today },
  { id: "pf-david", name: "David Tan", programmeId: p1, actorTypeId: at_judge, domainTags: ["Cloud", "DevOps", "Node.js"], bio: "GCP certified architect, judges at 5+ regional hackathons annually", embeddingStatus: "ready", dateAdded: today },
  { id: "pf-pixel", name: "PixelCraft", programmeId: p1, actorTypeId: at_team, domainTags: ["UI/UX", "Frontend"], bio: "Design-first team building a component marketplace", embeddingStatus: "ready", dateAdded: today },
  { id: "pf-form", name: "FormFlow", programmeId: p1, actorTypeId: at_team, domainTags: ["Node.js", "API", "B2B"], bio: "Two-person team building form automation for SMEs", embeddingStatus: "ready", dateAdded: today },
  { id: "pf-nexa", name: "NexaWeb", programmeId: p1, actorTypeId: at_team, domainTags: ["React", "SaaS", "Frontend"], bio: "Final year CS students building a no-code web builder", embeddingStatus: "ready", dateAdded: today },
  { id: "pf-cloudbase", name: "CloudBase", programmeId: p1, actorTypeId: at_team, domainTags: ["Cloud", "DevOps"], bio: "Past team — cloud cost optimization platform", embeddingStatus: "ready", dateAdded: today },

  { id: "pf-amir", name: "Amir Hassan", programmeId: p2, actorTypeId: at_mentor, domainTags: ["SaaS", "Growth", "Product"], bio: "Ex-CTO of two Malaysian startups, now advising Series A companies", embeddingStatus: "ready", dateAdded: today },
  { id: "pf-lim", name: "Lim Wei", programmeId: p2, actorTypeId: at_mentor, domainTags: ["AI/ML", "Python", "Research"], bio: "PhD in ML, led R&D at a regional AI lab for 6 years", embeddingStatus: "ready", dateAdded: today },
  { id: "pf-synth", name: "SynthAI", programmeId: p2, actorTypeId: at_startup, domainTags: ["AI/ML", "B2B", "SaaS"], bio: "Building AI-powered document processing for financial institutions", embeddingStatus: "ready", dateAdded: today },
  { id: "pf-verdant", name: "Verdant Systems", programmeId: p2, actorTypeId: at_startup, domainTags: ["IoT", "Hardware", "Climate"], bio: "Early-stage team developing smart agriculture sensors", embeddingStatus: "ready", dateAdded: today },
  { id: "pf-petronas", name: "Petronas Ventures", programmeId: p2, actorTypeId: at_partner, domainTags: ["Energy", "Investment", "ESG"], bio: "Corporate VC arm focused on deep tech and climate solutions", embeddingStatus: "ready", dateAdded: today },
  { id: "pf-databridge", name: "DataBridge", programmeId: p2, actorTypeId: at_startup, domainTags: ["SaaS", "Data"], bio: "Past startup — data integration platform", embeddingStatus: "ready", dateAdded: today },
];

export const seedLinkages: Linkage[] = [
  { id: "lk-1", programmeId: p1, templateId: tpl_hack, actorA: "pf-priya", actorB: "pf-pixel", matchScore: 92, matchRationale: "Strong UI/UX and frontend domain alignment. Priya has evaluated 6 design-focused teams averaging 4.5/5.", status: "proposed", outcomeScore: null },
  { id: "lk-2", programmeId: p1, templateId: tpl_hack, actorA: "pf-david", actorB: "pf-form", matchScore: 84, matchRationale: "Node.js and API overlap. David's past evaluations of B2B tool teams average 4.1/5.", status: "proposed", outcomeScore: null },
  { id: "lk-3", programmeId: p1, templateId: tpl_hack, actorA: "pf-priya", actorB: "pf-nexa", matchScore: 78, matchRationale: "Frontend overlap with some product fit. Similarity is high; outcome history is moderate.", status: "proposed", outcomeScore: null },
  { id: "lk-4", programmeId: p1, templateId: tpl_hack, actorA: "pf-david", actorB: "pf-cloudbase", matchScore: 81, matchRationale: "Cloud and DevOps overlap — past evaluation.", status: "completed", outcomeScore: 4 },

  { id: "lk-5", programmeId: p2, templateId: tpl_acc, actorA: "pf-lim", actorB: "pf-synth", matchScore: 94, matchRationale: "Near-perfect AI/ML domain match. Lim's 3 past mentees were AI-first B2B startups averaging 4.6/5.", status: "proposed", outcomeScore: null },
  { id: "lk-6", programmeId: p2, templateId: tpl_acc, actorA: "pf-amir", actorB: "pf-verdant", matchScore: 71, matchRationale: "Partial overlap via SaaS growth experience. No direct IoT history; cold start applies to hardware domain.", status: "proposed", outcomeScore: null },
  { id: "lk-7", programmeId: p2, templateId: tpl_acc, actorA: "pf-amir", actorB: "pf-databridge", matchScore: 88, matchRationale: "Strong SaaS and growth alignment — past mentorship.", status: "completed", outcomeScore: 5 },
];
