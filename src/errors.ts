export function messageFromError(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
