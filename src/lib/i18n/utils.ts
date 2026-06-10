import type { Messages } from "@/lib/i18n/messages/en";

export type MessagePatch = Record<string, unknown>;

export function deepMerge<T extends Record<string, unknown>>(base: T, patch: MessagePatch): T {
  const out = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    const bv = out[key];
    if (pv && typeof pv === "object" && !Array.isArray(pv) && bv && typeof bv === "object") {
      out[key] = deepMerge(bv as Record<string, unknown>, pv as MessagePatch);
    } else if (pv !== undefined) {
      out[key] = pv;
    }
  }
  return out as T;
}

/** Resolve dot-notation key e.g. "dashboard.savings" */
export function resolveMessage(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function formatMessage(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    vars[k] != null ? String(vars[k]) : `{${k}}`
  );
}
