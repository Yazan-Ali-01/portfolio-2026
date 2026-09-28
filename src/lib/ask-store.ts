import { Redis } from '@upstash/redis';

/* ---------------------------------------------------------------------------
   Storage for /ask: what it costs, and what people asked.

   The spend counter is the important half. This is a public endpoint holding
   an API key, so the question is not whether someone will hammer it but what
   happens when they do. Every reply adds its cost to a daily total, and once
   the total passes the ceiling the route stops calling OpenAI at all.

   The transcripts are the useful half. Every question a stranger asks is a
   thing a recruiter wanted to know and could not find on the site.
   --------------------------------------------------------------------------- */

let client: Redis | null = null;

function redis(): Redis {
  if (client) return client;

  // Same two names the /hi store reads: Vercel's Upstash integration has
  // shipped under both, and reading either survives a reconnect.
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('ask-store: no Upstash credentials.');

  client = new Redis({ url, token });
  return client;
}

/** USD per million tokens for the model in ask-prompt. Update with the price. */
const PRICE = { in: 0.4, out: 1.6 };

/** Daily ceiling in USD. Past this the route answers without calling OpenAI. */
export const DAILY_BUDGET = 2;

const day = () => new Date().toISOString().slice(0, 10);
const KEY = {
  spend: (d: string) => `ask:spend:${d}`,
  chat: (id: string) => `ask:chat:${id}`,
  chats: 'ask:chats',
  leads: 'ask:leads',
};

export async function spentToday(): Promise<number> {
  const v = await redis().get<number>(KEY.spend(day()));
  return typeof v === 'number' ? v : 0;
}

export async function withinBudget(): Promise<boolean> {
  return (await spentToday()) < DAILY_BUDGET;
}

/** Called after a reply, with the usage the API reported. */
export async function recordSpend(inTokens: number, outTokens: number): Promise<void> {
  const cost = (inTokens / 1e6) * PRICE.in + (outTokens / 1e6) * PRICE.out;
  const key = KEY.spend(day());
  // Redis has no float incr on a plain key, so store hundredths of a cent.
  const units = Math.max(1, Math.round(cost * 1e4));
  const total = await redis().incrby(`${key}:u`, units);
  await redis().expire(`${key}:u`, 60 * 60 * 24 * 40);
  await redis().set(key, total / 1e4, { ex: 60 * 60 * 24 * 40 });
}

export type Turn = { role: 'user' | 'assistant'; text: string };

/**
 * One conversation, kept whole. Stored against the chat's own id rather than
 * anything identifying: the value here is the questions, not the questioner.
 */
export async function saveTurn(chatId: string, turn: Turn): Promise<void> {
  const key = KEY.chat(chatId);
  await redis().rpush(key, JSON.stringify({ ...turn, at: Date.now() }));
  await redis().expire(key, 60 * 60 * 24 * 90);
  await redis().zadd(KEY.chats, { score: Date.now(), member: chatId });
}

export async function transcript(chatId: string): Promise<(Turn & { at: number })[]> {
  const raw = await redis().lrange<string>(KEY.chat(chatId), 0, -1);
  return raw.map((r) => (typeof r === 'string' ? JSON.parse(r) : r));
}

export async function recentChats(limit = 50): Promise<string[]> {
  return redis().zrange<string[]>(KEY.chats, 0, limit - 1, { rev: true });
}

export type Lead = { name: string; contact: string; note: string; chatId: string; at: number };

export async function addLead(lead: Omit<Lead, 'at'>): Promise<void> {
  await redis().rpush(KEY.leads, JSON.stringify({ ...lead, at: Date.now() }));
}

export async function leads(): Promise<Lead[]> {
  const raw = await redis().lrange<string>(KEY.leads, 0, -1);
  return raw.map((r) => (typeof r === 'string' ? JSON.parse(r) : r)).reverse();
}
