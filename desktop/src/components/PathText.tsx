import { tildify } from "../lib/format";

type PathTextProps = {
  /** The full machine string (path / url / command / email). */
  value: string;
  /** Collapse the home directory to `~` for display. */
  tilde?: boolean;
  /** Render in the monospace family (default true; pass false for emails). */
  mono?: boolean;
  className?: string;
};

/**
 * Single-line, ellipsis-truncated rendering for machine strings — paths, remote
 * URLs, SSH commands, emails. The full untruncated value is always available on
 * hover via the native title tooltip, so truncation never hides information.
 * This replaces the old `overflow-wrap: anywhere` rules that broke long strings
 * character-by-character across many ragged lines.
 */
export function PathText({
  value,
  tilde = false,
  mono = true,
  className,
}: PathTextProps) {
  const display = tilde ? tildify(value) : value;
  const classes = ["truncate"];
  if (mono) classes.push("mono");
  if (className) classes.push(className);

  return (
    <span className={classes.join(" ")} title={value}>
      {display}
    </span>
  );
}
