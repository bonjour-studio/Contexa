import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { CheckStatus } from "../domain/gitscope";

const statusIcon = {
  failed: XCircle,
  passed: CheckCircle2,
  warning: AlertTriangle,
};

export function StatusBadge({
  status,
  label,
}: {
  status: CheckStatus;
  label: string;
}) {
  const Icon = statusIcon[status];

  return (
    <span className={`status-badge ${status}`}>
      <Icon aria-hidden="true" size={14} strokeWidth={2.3} />
      {label}
    </span>
  );
}

export function StatusDot({ status }: { status: CheckStatus }) {
  return <span className={`status-dot ${status}`} aria-hidden="true" />;
}
