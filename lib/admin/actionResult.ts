export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function ok<T = undefined>(data?: T): ActionResult<T> {
  return data === undefined ? { ok: true } : { ok: true, data };
}

export function err(error: string): ActionResult<never> {
  return { ok: false, error };
}

export function toErrorMessage(e: unknown, fallback = "Something went wrong") {
  if (e instanceof Error) return e.message || fallback;
  if (typeof e === "string") return e || fallback;
  return fallback;
}

/** Map raw DB error messages to user-friendly ones */
export function friendlyDbError(dbMessage: string): string {
  const m = dbMessage;
  const nullMatch = m.match(/null value in column "([^"]+)" of relation "[^"]+" violates not-null constraint/);
  if (nullMatch) return `Fill in the required field: ${nullMatch[1]}`;

  const typeMatch = m.match(/invalid input syntax for type (\w+).*column "([^"]+)"/);
  if (typeMatch) return `${typeMatch[2]} must be a valid ${typeMatch[1]}`;

  if (m.includes("violates not-null constraint"))
    return "Fill in all required fields";
  if (m.includes("violates foreign key constraint"))
    return "This value must reference an existing record";
  if (m.includes("duplicate key") || m.includes("unique constraint"))
    return "This value already exists";

  return m;
}

