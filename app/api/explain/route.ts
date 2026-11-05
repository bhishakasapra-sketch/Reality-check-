import Anthropic from "@anthropic-ai/sdk";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You are the explanation engine inside Reality Check, an educational platform where people run simplified simulations of economic, business and environmental decisions.
How to answer:
- Explain from first principles: lay out the causal chain step by step (cause, mechanism, effect), and say why each link happens.
- Keep three things distinct and label them in words: what this simplified model assumes, what real-world evidence generally shows, and where economists genuinely disagree.
- Never invent statistics. Only cite a figure if it is widely established and you name its source; otherwise speak qualitatively.
- Plain language, but do not oversimplify: name the real concept (for example aggregate demand, price elasticity, externality, multiplier) and explain it briefly.
- Mention at least one possible unexpected or second-order consequence when relevant.
- 120 to 260 words. Short paragraphs. You may use "- " bullet lines. No headings, no tables.
The model outputs in the context are illustrative estimates from the page's own simplified model, not forecasts.`;

/* Simple in-memory rate limit. On serverless hosts each instance has its own
   memory, so treat this as a speed bump; use Upstash/Redis for a hard limit. */
const hits = new Map<string, { n: number; reset: number }>();
function limited(key: string, max = 12, windowMs = 60_000) {
  const now = Date.now(), h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return false; }
  h.n++; return h.n > max;
}
const json = (status: number, error: string) => Response.json({ error }, { status });

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(503, "Explanations aren’t set up on this site yet. The owner needs to add an ANTHROPIC_API_KEY.");

  // who is asking
  let key = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anon";
  const supabase = getServerSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) key = data.user.id;
    else if (process.env.AI_REQUIRE_SIGN_IN !== "false") return json(401, "Sign in to use the explanation assistant.");
  }
  if (limited(key)) return json(429, "Too many questions in a short time. Wait a minute, then ask again.");

  // validate input
  let body: { page?: unknown; context?: unknown; messages?: unknown };
  try { body = await req.json(); } catch { return json(400, "Invalid request."); }
  const page = typeof body.page === "string" ? body.page.slice(0, 40) : "home";
  const ctx = JSON.stringify(body.context ?? {}).slice(0, 4000);
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 8) return json(400, "Invalid conversation.");
  const msgs: Msg[] = [];
  for (const m of body.messages as Msg[]) {
    if ((m?.role !== "user" && m?.role !== "assistant") || typeof m.content !== "string") return json(400, "Invalid message.");
    msgs.push({ role: m.role, content: m.content.slice(0, 2000) });
  }
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json(400, "The last message must be a question.");
  const last = msgs[msgs.length - 1];
  last.content = `Current page: ${page}\nSimulation context (JSON): ${ctx}\n\nQuestion: ${last.content}`;

  const client = new Anthropic({ apiKey });
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const s = client.messages.stream({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: 700, system: SYSTEM, messages: msgs });
        for await (const ev of s) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") controller.enqueue(enc.encode(ev.delta.text));
        }
      } catch (e) {
        console.error("explain error", e);
        controller.enqueue(enc.encode("\n\nThe explanation stopped early because of a server error. Try asking again."));
      }
      controller.close();
    }
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
