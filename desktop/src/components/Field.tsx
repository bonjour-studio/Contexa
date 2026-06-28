import type { ReactNode } from "react";

/**
 * One "label -> value" row inside a grouped-list `.group`. The value cell
 * truncates long content; wrap machine strings in <PathText> for a tooltip.
 */
export function FieldRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="row field">
      <span className="field-label">{label}</span>
      <span className="field-value">{children}</span>
    </div>
  );
}
