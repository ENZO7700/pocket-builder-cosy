import { getRequest } from "@tanstack/react-start/server";
import {
  abortKind,
  GENERATE_TIMEOUT_MS,
  withTimeout,
} from "@/lib/ai/abort-signal";

export function incomingGenerateSignal(): AbortSignal {
  let incoming: AbortSignal | undefined;
  try {
    incoming = getRequest()?.signal;
  } catch {
    incoming = undefined;
  }
  if (!incoming) return AbortSignal.timeout(GENERATE_TIMEOUT_MS);
  return withTimeout(incoming, GENERATE_TIMEOUT_MS);
}

export function logGenerateAbort(signal: AbortSignal): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[generate] aborted", { reason: abortKind(signal) ?? "cancel" });
}
