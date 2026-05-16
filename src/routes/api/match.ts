import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const BodySchema = z.object({
  programme: z.object({
    name: z.string().min(1).max(200),
    theme: z.string().min(1).max(200),
  }),
  source: z.object({
    name: z.string().min(1).max(200),
    actorType: z.string().min(1).max(200),
    roleCategory: z.enum(["supply", "demand", "neutral"]),
    domainTags: z.array(z.string().min(1).max(80)).max(20),
    bio: z.string().max(2000),
  }),
  candidates: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        name: z.string().min(1).max(200),
        actorType: z.string().min(1).max(200),
        domainTags: z.array(z.string().min(1).max(80)).max(20),
        bio: z.string().max(2000),
      }),
    )
    .min(1)
    .max(20),
});

const ResultSchema = z.object({
  matches: z
    .array(
      z.object({
        candidateId: z.string(),
        score: z.number().min(0).max(100),
        rationale: z.string().min(10).max(400),
      }),
    )
    .max(20),
});

export const Route = createFileRoute("/api/match")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
        }
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        const { programme, source, candidates } = parsed.data;

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const prompt = `You are an AI matching engine for the "${programme.name}" programme (${programme.theme}).
Score each candidate from 0-100 for compatibility with the source participant and write a one-sentence rationale citing shared domains, complementarity, or relevant fit. Be concrete; reference actual tags or bio details.

SOURCE (${source.roleCategory} — ${source.actorType}):
Name: ${source.name}
Tags: ${source.domainTags.join(", ") || "(none)"}
Bio: ${source.bio}

CANDIDATES:
${candidates
  .map(
    (c, i) =>
      `${i + 1}. id=${c.id} | ${c.name} (${c.actorType})\n   Tags: ${c.domainTags.join(", ") || "(none)"}\n   Bio: ${c.bio}`,
  )
  .join("\n")}

Return a score and rationale for every candidate.`;

        try {
          const { experimental_output } = await generateText({
            model,
            output: Output.object({ schema: ResultSchema }),
            prompt,
          });
          return Response.json(experimental_output);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "AI gateway error";
          const status = /402/.test(msg) ? 402 : /429/.test(msg) ? 429 : 502;
          return new Response(JSON.stringify({ error: msg }), {
            status,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
