import { FileDiff, Network, Play, ShieldCheck, Wifi } from "lucide-react";
import { FieldRow } from "../../components/Field";
import { PathText } from "../../components/PathText";
import { StatusBadge, StatusDot } from "../../components/StatusBadge";
import type {
  ApplyPlan,
  ConnectionTestResult,
  GitIdentityProfile,
  PreflightResult,
  RepositoryStatus,
} from "../../domain/gitscope";

type GitIdentityPanelProps = {
  status: RepositoryStatus | null;
  linkedProfile: GitIdentityProfile | null;
  applyPlan: ApplyPlan | null;
  preflight: PreflightResult | null;
  connectionResult: ConnectionTestResult | null;
  busy: boolean;
  onApply: () => void;
  onTestSsh: () => void;
  onTestRemote: () => void;
  onGoToOverview: () => void;
};

export function GitIdentityPanel({
  status,
  linkedProfile,
  applyPlan,
  preflight,
  connectionResult,
  busy,
  onApply,
  onTestSsh,
  onTestRemote,
  onGoToOverview,
}: GitIdentityPanelProps) {
  if (!status) {
    return (
      <section className="group">
        <div className="empty-block">
          <Network aria-hidden="true" size={24} />
          <h3>Not a git repository</h3>
          <p className="empty-copy">
            Git identity can only be applied inside a git repository.
          </p>
        </div>
      </section>
    );
  }

  if (!linkedProfile) {
    return (
      <section className="group">
        <div className="empty-block">
          <ShieldCheck aria-hidden="true" size={24} />
          <h3>No profile linked</h3>
          <p className="empty-copy">
            Link a profile in Overview to preview and apply its git identity.
          </p>
          <button
            className="primary-action icon-button"
            onClick={onGoToOverview}
            type="button"
          >
            <Play aria-hidden="true" size={15} />
            <span>Go to Overview</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="section">
        <div className="section-head">
          <span className="section-label">Apply target · {linkedProfile.label}</span>
          <StatusBadge
            status={preflight?.canApply ? "passed" : "warning"}
            label={preflight?.canApply ? "Ready" : "Review"}
          />
        </div>
        <div className="group">
          <FieldRow label="Repository">
            <PathText value={status.repository.rootPath} tilde />
          </FieldRow>
          <FieldRow label="Writes">.git/config via git config --local</FieldRow>
          <FieldRow label="SSH command">
            {applyPlan?.sshCommand ? (
              <PathText value={applyPlan.sshCommand} />
            ) : (
              "Waiting for plan"
            )}
          </FieldRow>
        </div>
        <div className="review-actions">
          <button
            className="icon-button"
            disabled={busy}
            onClick={onTestSsh}
            type="button"
          >
            <Wifi aria-hidden="true" size={15} />
            <span>Test SSH</span>
          </button>
          <button
            className="icon-button"
            disabled={busy}
            onClick={onTestRemote}
            type="button"
          >
            <Network aria-hidden="true" size={15} />
            <span>Test remote</span>
          </button>
          <button
            className="primary-action icon-button"
            disabled={busy || !preflight?.canApply || applyPlan?.changes.length === 0}
            onClick={onApply}
            type="button"
          >
            <Play aria-hidden="true" size={15} />
            <span>
              {applyPlan?.changes.length === 0 ? "Already applied" : "Apply"}
            </span>
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-label">Preflight</span>
        </div>
        <div className="group">
          {preflight?.checks.map((check) => (
            <div className="row check" key={check.id}>
              <StatusDot status={check.status} />
              <div className="row-body">
                <span className="row-title">{check.label}</span>
                <span className="row-sub">{check.message}</span>
              </div>
            </div>
          )) ?? (
            <div className="row">
              <span className="empty-copy">Preflight pending.</span>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-label">Diff preview</span>
          <FileDiff aria-hidden="true" size={15} className="section-icon" />
        </div>
        <pre className="diff-view">{applyPlan?.diff ?? "No preview available."}</pre>
      </section>

      {connectionResult && (
        <section className="section">
          <div className="section-head">
            <span className="section-label">
              Connection test · {connectionResult.commandLabel}
            </span>
            <StatusBadge
              status={connectionResult.success ? "passed" : "failed"}
              label={connectionResult.success ? "Passed" : "Failed"}
            />
          </div>
          <pre className="command-output">
            {[connectionResult.stdout, connectionResult.stderr]
              .filter(Boolean)
              .join("\n") || `Exit code ${connectionResult.exitCode ?? "unknown"}`}
          </pre>
        </section>
      )}
    </>
  );
}
