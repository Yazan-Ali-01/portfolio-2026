import { useEffect, useRef, useState } from 'preact/hooks';

/* ---------------------------------------------------------------------------
   The transcript (E12).

   Not a chat. Answers are set as an interview: a question, an answer, and
   numbered footnotes where the claims are. The margin holds what the answer
   drew on and fills in as it is written, which is the honest reply to "how do
   I know this is not invented".
   --------------------------------------------------------------------------- */

export type FactRef = { topic: string; text: string; label?: string; href?: string };

interface Props {
  facts: Record<string, FactRef>;
  total: number;
  openers: string[];
}

type Answer = { text: string; cites: string[] };
type Entry = { q: string; a: Answer | null };

/**
 * `[fact-id]` where the claim is, and `[a, b, c]` when one sentence rests on
 * several. The first version matched a single id only, so a list failed to
 * match at all and rendered as literal brackets in the middle of the answer.
 * Unknown ids are dropped rather than shown.
 */
const CITE = /\[([a-z0-9-]+(?:\s*,\s*[a-z0-9-]+)*)\]/g;

/**
 * Split an answer into paragraphs of text and citation markers, numbering each
 * distinct fact the first time it appears.
 */
function parse(raw: string, known: Record<string, FactRef>) {
  const end = raw.search(/\n*SOURCES:/i);
  let body = end === -1 ? raw : raw.slice(0, end);

  // Mid-stream the tail can be half a citation. Hide it until it closes.
  body = body.replace(/\[[a-z0-9-]*$/i, '');

  const order: string[] = [];
  const paragraphs = body
    .split(/\n{2,}/)
    .map((para) => {
      const nodes: ({ text: string } | { n: number })[] = [];
      let last = 0;
      let m: RegExpExecArray | null;
      CITE.lastIndex = 0;

      while ((m = CITE.exec(para))) {
        const ids = m[1].split(',').map((id) => id.trim()).filter((id) => known[id]);

        /*
         * A bracket is a citation only if something inside it is a real fact.
         * Consuming every bracket ate ordinary prose — "an array [1, 2]" lost
         * its contents silently, which is worse than the rare hallucinated id
         * showing through, because that one is visible and the audit checks
         * for it.
         */
        if (!ids.length) continue;
        if (m.index > last) nodes.push({ text: para.slice(last, m.index) });

        for (const id of ids) {
          if (!order.includes(id)) order.push(id);
          nodes.push({ n: order.indexOf(id) + 1 });
        }
        last = m.index + m[0].length;
      }
      if (last < para.length) nodes.push({ text: para.slice(last) });
      return nodes;
    })
    .filter((nodes) => nodes.length);

  return { paragraphs, cites: order };
}

export default function Ask({ facts, total, openers }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [live, setLive] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const chatId = useRef('');
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  /** The fact a reader is pointing at, and the one they opened to read. */
  const [hot, setHot] = useState('');
  const [open, setOpen] = useState('');

  useEffect(() => {
    chatId.current =
      globalThis.crypto?.randomUUID?.() ?? `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    /*
     * A question can arrive in the URL, which is how the box at the foot of a
     * case study works: it is a plain GET form, so it needs no JavaScript of
     * its own and the link is shareable. Asked once, then cleared from the
     * address bar so a refresh does not spend another call.
     */
    const asked = new URLSearchParams(location.search).get('q');
    if (asked?.trim()) {
      history.replaceState(null, '', location.pathname);
      send(asked.trim());
    }

    /*
     * Focus where there is a real pointer. The whole page is one field, so a
     * visitor on a laptop should be able to type the moment it loads. Not on
     * touch: autofocus there throws the keyboard up over the page before
     * anyone has read what this thing is or that it is not him.
     *
     * preventScroll, or focusing drags the viewport to the bottom of the page
     * past the heading that explains it.
     */
    if (window.matchMedia('(pointer: fine)').matches) {
      field.current?.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight;
  }, [entries, live]);

  /** What the margin shows: the facts behind whatever was answered last. */
  const latest = live
    ? parse(live, facts).cites
    : entries.length
      ? (entries[entries.length - 1].a?.cites ?? [])
      : [];

  const consulted = new Set(entries.flatMap((e) => e.a?.cites ?? []));

  async function send(question: string) {
    const text = question.trim();
    if (!text || busy) return;

    setError('');
    setDraft('');
    setBusy(true);

    const history = entries.flatMap((e) =>
      e.a ? [{ role: 'user', text: e.q }, { role: 'assistant', text: e.a.text }] : [],
    );
    setEntries((list) => [...list, { q: text, a: null }]);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, chatId: chatId.current }),
      });

      if (!res.ok || !res.body) {
        const reason = await res
          .json()
          .then((j: { reason?: string }) => j.reason)
          .catch(() => '');
        setError(reason || 'That did not go through. Try again in a moment.');
        setEntries((list) => list.slice(0, -1));
        setBusy(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        setLive(raw);
      }

      const parsed = parse(raw, facts);
      setEntries((list) => {
        const next = [...list];
        next[next.length - 1] = {
          ...next[next.length - 1],
          a: { text: raw, cites: parsed.cites },
        };
        return next;
      });
      setLive('');
    } catch {
      setError('That did not go through. Try again in a moment.');
      setEntries((list) => list.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  function Answer({ raw }: { raw: string }) {
    const { paragraphs, cites } = parse(raw, facts);
    return (
      <>
        {paragraphs.map((nodes) => (
          <p class="qa__a">
            {nodes.map((node, i) => {
              if ('text' in node) return node.text;
              // A sentence resting on six facts renders six superscripts in a
              // row, which runs together into one illegible number without a
              // separator between them.
              const run = i > 0 && !('text' in nodes[i - 1]);
              const id = cites[node.n - 1];
              return (
                <sup>
                  {run ? <span class="qa__comma">,</span> : ''}
                  <button
                    type="button"
                    class={`qa__mark${hot === id ? ' is-hot' : ''}`}
                    onMouseEnter={() => setHot(id)}
                    onMouseLeave={() => setHot('')}
                    onClick={() => setOpen(open === id ? '' : id)}
                    aria-label={`Source ${node.n}: ${facts[id]?.topic ?? id}`}
                  >
                    {node.n}
                  </button>
                </sup>
              );
            })}
          </p>
        ))}
        {!!cites.length && (
          <ol class="qa__notes">
            {cites.map((id) => (
              <li
                class={hot === id ? 'is-hot' : ''}
                onMouseEnter={() => setHot(id)}
                onMouseLeave={() => setHot('')}
              >
                {/* Not every fact has a page. Those fall back to their topic,
                    so the note never reads as the id printed twice. */}
                {facts[id]?.href ? (
                  <a href={facts[id].href}>{facts[id].label}</a>
                ) : (
                  <span>{facts[id]?.topic ?? 'the record'}</span>
                )}
                <button
                  type="button"
                  class="qa__id"
                  onClick={() => setOpen(open === id ? '' : id)}
                >
                  {id}
                </button>
                {open === id && <p class="qa__quote">{facts[id]?.text}</p>}
              </li>
            ))}
          </ol>
        )}
      </>
    );
  }

  const ids = Object.keys(facts);

  return (
    <div class="qa">
      {/*
        The record, as thirty marks. It fills in as the conversation touches
        each fact, so a reader can see at a glance how much of him has been
        covered and what is still untouched.
      */}
      <div class="qa__dial">
        <ul class="qa__dots" aria-hidden="true">
          {ids.map((id) => (
            <li
              class={`${consulted.has(id) ? 'is-used' : ''}${latest.includes(id) ? ' is-now' : ''}${hot === id ? ' is-hot' : ''}`}
              title={`${facts[id].topic} · ${id}`}
              onMouseEnter={() => setHot(id)}
              onMouseLeave={() => setHot('')}
            />
          ))}
        </ul>
        <p class="qa__count">
          {consulted.size} of {ids.length} consulted
        </p>
      </div>

      <div class="qa__scroll" ref={scroller}>
        <div class="qa__thread">
          {entries.map((entry, i) => (
            <article class="qa__entry">
              <p class="qa__q">
                <span class="qa__tag">Q</span>
                {entry.q}
              </p>
              {entry.a ? (
                <Answer raw={entry.a.text} />
              ) : live ? (
                <Answer raw={live} />
              ) : (
                i === entries.length - 1 && <p class="qa__a qa__waiting">thinking</p>
              )}
            </article>
          ))}

          {!entries.length && (
            <div class="qa__openers">
              {openers.map((q) => (
                <button type="button" onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* The margin. Desktop only; on a phone the footnotes already say this. */}
      <aside class="qa__margin">
        <p class="qa__marginhead">Drawing on</p>
        {latest.length ? (
          <ul class="qa__facts">
            {latest.map((id, i) => (
              <li
                style={`--i:${i}`}
                class={hot === id ? 'is-hot' : ''}
                onMouseEnter={() => setHot(id)}
                onMouseLeave={() => setHot('')}
              >
                <span class="qa__factn">{i + 1}</span>
                <button type="button" onClick={() => setOpen(open === id ? '' : id)}>
                  <span class="qa__facttopic">{facts[id]?.topic ?? 'record'}</span>
                  <span class="qa__factid">{id}</span>
                </button>
                {open === id && <p class="qa__quote">{facts[id]?.text}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p class="qa__marginempty">Nothing yet. Ask something.</p>
        )}
      </aside>

      <form
        class="qa__form"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <label class="u-skip" for="ask-input">
          Ask about Yazan
        </label>
        <span class="qa__prompt" aria-hidden="true">
          Ask
        </span>
        <input
          ref={field}
          id="ask-input"
          class="qa__input"
          value={draft}
          placeholder="anything about his work"
          autocomplete="off"
          maxLength={500}
          onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
          disabled={busy}
        />
        <button class="qa__send" type="submit" disabled={busy || !draft.trim()}>
          Ask
        </button>
      </form>

      {error && <p class="qa__error">{error}</p>}
    </div>
  );
}
