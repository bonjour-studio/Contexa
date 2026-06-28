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

/**
 * Like FieldRow but the value cell holds an interactive control (input /
 * select / picker), which stretches to fill the row.
 */
export function ControlRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="row control">
      <span className="field-label">{label}</span>
      {children}
    </div>
  );
}
