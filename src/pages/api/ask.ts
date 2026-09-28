import type { APIRoute } from 'astro';
import { MAX_TOKENS, MAX_TURNS, MODEL, systemPrompt } from '../../lib/ask-prompt';
import { recordSpend, saveTurn, withinBudget } from '../../lib/ask-store';
import { checkMessage } from '../../lib/hi-guards';
import { withinLimit } from '../../lib/hi-store';
import { clientIp, json } from '../../lib/hi-visitor';

export const prerender = false;

/**
 * Ask about Yazan.
 *
 * The gates narrow the same way the wall's do: the cheap checks first, so
 * someone hammering the endpoint is turned away before anything is spent. The
 * budget gate is last of the cheap ones and matters most, because everything
 * past it costs money.
 */
export const POST: APIRoute = async (context) => {
  const ip = clientIp(context.request);

  if (!(await withinLimit('ask', ip, 12, 3600))) {
    return json({ ok: false, reason: 'That is enough questions for one hour.' }, 429);
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, reason: 'Ask something first.' }, 400);
  }

  const fields = (body ?? {}) as { message?: unknown; history?: unknown; chatId?: unknown };

  const asked = checkMessage(fields.message);
  if (!asked.ok) return json({ ok: false, reason: asked.reason }, 422);

  const chatId = typeof fields.chatId === 'string' ? fields.chatId.slice(0, 40) : '';
  if (!/^[a-z0-9-]{8,40}$/.test(chatId)) {
    return json({ ok: false, reason: 'Reload the page and try again.' }, 400);
  }

  /*
   * History arrives from the client, so it is treated as input rather than as
   * record: trimmed, capped, and never trusted to carry a system message.
   */
  const history = Array.isArray(fields.history) ? fields.history : [];
  const turns = history
    .filter(
      (t): t is { role: string; text: string } =>
        !!t && typeof t === 'object' && typeof (t as { text?: unknown }).text === 'string',
    )
    .slice(-MAX_TURNS)
    .map((t) => ({
      role: t.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: String(t.text).slice(0, 2000),
    }));

  if (!(await withinBudget())) {
    return json(
      {
        ok: false,
        reason:
          'He has had a lot of questions today and this has reached its daily limit. ' +
          'Email him at yazan.ali.dev@gmail.com and he will answer himself.',
      },
      503,
    );
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) return json({ ok: false, reason: 'Not configured.' }, 500);

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: MAX_TOKENS,
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt() },
        ...turns,
        { role: 'user', content: asked.value },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return json({ ok: false, reason: 'That did not go through. Try again in a moment.' }, 502);
  }

  await saveTurn(chatId, { role: 'user', text: asked.value });

  /*
   * Re-streamed as plain text rather than passed through: the client should
   * not have to parse OpenAI's envelope, and this is the one place that knows
   * how much the answer cost.
   */
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';
      let answer = '';
      let usage: { prompt_tokens?: number; completion_tokens?: number } | null = null;

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') continue;

            try {
              const chunk = JSON.parse(payload);
              if (chunk.usage) usage = chunk.usage;
              const piece = chunk.choices?.[0]?.delta?.content;
              if (typeof piece === 'string' && piece) {
                answer += piece;
                controller.enqueue(encoder.encode(piece));
              }
            } catch {
              // A partial frame; the next read completes it.
            }
          }
        }
      } finally {
        controller.close();
        if (answer) await saveTurn(chatId, { role: 'assistant', text: answer });
        if (usage) {
          await recordSpend(usage.prompt_tokens ?? 0, usage.completion_tokens ?? 0);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
};
