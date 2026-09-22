/**
 * Compact serializers for the schedule data we hand the model.
 *
 * These prompts used to embed `JSON.stringify(rows)`, which repeats every
 * key name on every row — with 50 tasks that is 50 copies of
 * "scheduled_start", "calendar_event_id" and so on, and the model gains
 * nothing from them. A header line plus pipe-delimited rows carries the same
 * information for a fraction of the tokens, and every token here is billed on
 * every single question the user asks.
 */

/** Notes are free text and can be arbitrarily long — one pathological task
 *  could otherwise dominate the whole prompt. Enough to orient the model,
 *  not enough to let one row run away with the budget. */
const MAX_NOTE_CHARS = 100;

/** Drops the milliseconds Postgres/Google hand us. The model still has
 *  minute precision, which is all a calendar answer needs. */
function shortTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  return String(iso).replace(/:\d{2}\.\d{3}(Z|[+-]\d{2}:\d{2})$/, '$1');
}

function clean(v: unknown): string {
  if (v === null || v === undefined || v === '') return '-';
  // Pipes are the column separator, and newlines are the row separator.
  return String(v).replace(/[|\r\n]+/g, ' ').trim();
}

export interface PromptTask {
  id: string;
  title: string | null;
  status: string | null;
  urgency: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  due_date: string | null;
  notes: string | null;
}

export interface FormattedTasks {
  text: string;
  /** ref (T1, T2, ...) -> real task uuid. */
  refs: Map<string, string>;
}

/**
 * Tasks are labelled T1..Tn rather than carrying their uuid.
 *
 * Two reasons. Fifty uuids cost ~1,700 tokens on every single question, and
 * they buy nothing the model reasons about. They are also a reliability
 * hazard: asking a model to echo a 36-character uuid exactly is a good way
 * to get a subtly wrong one back, and then the reschedule silently misses.
 *
 * The ref never leaves the server — the ask route swaps it back to the real
 * uuid before handing the action to the client, so the execute path still
 * receives an ordinary task_id and needs no changes.
 *
 * `calendar_event_id` is deliberately absent too: the model never needs it.
 * The route looks the event id up from the database itself.
 */
export function formatTasks(tasks: PromptTask[] | null | undefined): FormattedTasks {
  const refs = new Map<string, string>();
  if (!tasks || tasks.length === 0) return { text: '(none)', refs };

  const rows = tasks.map((t, i) => {
    const ref = `T${i + 1}`;
    refs.set(ref, t.id);
    const note = t.notes ? clean(t.notes).slice(0, MAX_NOTE_CHARS) : '-';
    return [
      ref,
      clean(t.title),
      clean(t.status),
      clean(t.urgency),
      shortTime(t.scheduled_start),
      shortTime(t.scheduled_end),
      shortTime(t.due_date),
      note,
    ].join(' | ');
  });

  return {
    text: ['ref | title | status | urgency | start | end | due | notes', ...rows].join('\n'),
    refs,
  };
}

export interface PromptEvent {
  summary: string;
  start: string;
  end: string;
}

export function formatEvents(events: PromptEvent[] | null | undefined): string {
  if (!events || events.length === 0) return '(none)';
  const rows = events.map((e) =>
    [clean(e.summary), shortTime(e.start), shortTime(e.end)].join(' | '),
  );
  return ['title | start | end', ...rows].join('\n');
}
