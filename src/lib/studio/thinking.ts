const DEFAULT_FILES = ["index.html", "styles.css", "src/app.js"] as const;

export function filesForBrief(_brief: string): string[] {
  return [...DEFAULT_FILES];
}
