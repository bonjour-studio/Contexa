export function shortPath(path: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 3) {
    return path;
  }

  return `.../${parts.slice(-3).join("/")}`;
}

export function formatDate(epochSeconds: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(epochSeconds * 1000));
}
