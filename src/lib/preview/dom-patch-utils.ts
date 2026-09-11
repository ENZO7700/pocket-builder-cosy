export function scriptSignature(html: string): string {
  const parts: string[] = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const attrs = match[1].replace(/\s+/g, " ").trim();
    const body = match[2].replace(/\s+/g, " ").trim();
    parts.push(`${attrs}\n${body}`);
  }
  return parts.join("\n;;\n");
}

export function shouldReloadPreview(prevHtml: string, nextHtml: string): boolean {
  if (!prevHtml || !nextHtml) return true;
  return scriptSignature(prevHtml) !== scriptSignature(nextHtml);
}
