import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export const PRAY_CATS = ["Family", "Friends", "Church", "World", "Me"] as const;

const AddAction = z.object({
  type: z.literal("add"),
  who: z.string(),
  what: z.string(),
  cat: z.enum(PRAY_CATS),
  daily: z.boolean(),
  until: z.string(), // YYYY-MM-DD or ""
});
const RefAction = z.object({ type: z.enum(["answered", "remove"]), id: z.string() });
export const PrayerResult = z.object({
  actions: z.array(z.union([AddAction, RefAction])),
  reply: z.string(),
});
export type PrayerResult = z.infer<typeof PrayerResult>;

export interface ExistingRequest {
  id: string;
  who: string;
  what?: string;
}

export function buildPrompt(today: string, existing: ExistingRequest[], note: string): string {
  const list = existing.map((p) => `${p.id} · ${p.who}${p.what ? " · " + p.what : ""}`).join("\n") || "(empty)";
  return `You turn a person's plain-language note into prayer-list actions for a personal devotions app. Today is ${today}.
Existing active requests (id · who · what):
${list}

Rules: one add per distinct person or need. Time words set until: "today" = today, "this week" = 7 days from today, "this month" = 30 days, "for N days/weeks" accordingly, otherwise "". "every day"/"daily" sets daily true. cat: spouse, children, parents, siblings → Family; pastor, church, small group → Church; nations, missionaries, leaders, disasters → World; the writer's own need (I, me, my) → Me; anyone else → Friends. Keep "what" short and in the writer's words; "" if there is none. If the note says an existing request was answered, resolved, healed, or is no longer needed, use answered (or remove if they say to remove or delete it) with the matching id — do not add a duplicate. reply is one warm sentence of at most 12 words.

Note (between the markers): <<<${note.replace(/>>>/g, "")}>>>`;
}

/** Sanitizes model output against the same rules the client applies. */
export function normalize(result: PrayerResult, existingIds: Set<string>): PrayerResult {
  const actions: PrayerResult["actions"] = result.actions.flatMap((a): PrayerResult["actions"] => {
    if (a.type === "add") {
      const who = a.who.trim().slice(0, 80);
      if (!who) return [];
      return [{ ...a, who, what: a.what.trim().slice(0, 200), until: /^\d{4}-\d{2}-\d{2}$/.test(a.until) ? a.until : "" }];
    }
    return existingIds.has(a.id) ? [a] : [];
  });
  return { actions, reply: result.reply.slice(0, 200) };
}

export async function parsePrayerNote(apiKey: string, today: string, existing: ExistingRequest[], note: string): Promise<PrayerResult> {
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 45_000 });
  const message = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 1024,
    output_config: { format: zodOutputFormat(PrayerResult), effort: "low" },
    messages: [{ role: "user", content: buildPrompt(today, existing, note) }],
  });
  if (message.stop_reason === "refusal" || !message.parsed_output) {
    return { actions: [], reply: "I couldn't make a request out of that." };
  }
  return normalize(message.parsed_output, new Set(existing.map((e) => e.id)));
}
