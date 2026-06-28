/** Collapse the user's home directory to `~` (macOS /Users, Linux /home). */
export function tildify(path: string) {
  return path.replace(/^\/(?:Users|home)\/[^/]+(?=\/|$)/, "~");
}

/**
 * Compact a path for tight labels: collapse home to `~` and, when still deep,
 * keep the leaf two segments (`~/…/Code/Contexa`). The leaf is what identifies
 * the repo, so it is always preserved; the full path goes in a tooltip.
 */
export function shortPath(path: string) {
  const tilde = tildify(path);
  const parts = tilde.split("/").filter(Boolean);
  if (parts.length <= 3) {
    return tilde;
  }

  const tail = parts.slice(-2).join("/");
  return tilde.startsWith("~") ? `~/…/${tail}` : `…/${tail}`;
}

export function formatDate(epochSeconds: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(epochSeconds * 1000));
}
