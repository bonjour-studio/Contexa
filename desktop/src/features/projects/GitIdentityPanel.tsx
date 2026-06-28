import {
  FileDiff,
  Network,
  Play,
  ShieldCheck,
  Terminal,
  Wifi,
} from "lucide-react";
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
      <section className="panel empty-state-panel">
        <Network aria-hidden="true" size={24} />
        <h3>Not a git repository</h3>
        <p className="empty-copy">
          Git identity can only be applied inside a git repository.
        </p>
      </section>
    );
  }

  if (!linkedProfile) {
    return (
      <section className="panel empty-state-panel">
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
          <Play aria-hidden="true" size={17} />
          <span>Go to Overview</span>
        </button>
      </section>
    );
  }

  return (
    <div className="review-layout">
      <section className="panel review-target-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Apply Target</span>
            <h3>{linkedProfile.label}</h3>
          </div>
          <StatusBadge
            status={preflight?.canApply ? "passed" : "warning"}
            label={preflight?.canApply ? "Ready" : "Review"}
          />
        </div>

        <dl className="compact-list">
          <div>
            <dt>Repository</dt>
            <dd>
              <PathText value={status.repository.rootPath} tilde />
            </dd>
          </div>
          <div>
            <dt>Writes</dt>
            <dd>.git/config via git config --local</dd>
          </div>
          <div>
            <dt>SSH command</dt>
            <dd>
              {applyPlan?.sshCommand ? (
                <PathText value={applyPlan.sshCommand} />
              ) : (
                "Waiting for plan"
              )}
            </dd>
          </div>
        </dl>

        <div className="review-actions">
          <button
            className="icon-button"
            disabled={busy}
            onClick={onTestSsh}
            type="button"
          >
            <Wifi aria-hidden="true" size={17} />
            <span>SSH</span>
          </button>
          <button
            className="icon-button"
            disabled={busy}
            onClick={onTestRemote}
            type="button"
          >
            <Network aria-hidden="true" size={17} />
            <span>Remote</span>
          </button>
          <button
            className="primary-action icon-button"
            disabled={busy || !preflight?.canApply || applyPlan?.changes.length === 0}
            onClick={onApply}
            type="button"
          >
            <Play aria-hidden="true" size={17} />
            <span>
              {applyPlan?.changes.length === 0 ? "Already applied" : "Apply"}
            </span>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading compact">
          <div>
            <span className="eyebrow">Preflight</span>
            <h3>Checks</h3>
          </div>
        </div>
        <div className="check-list">
          {preflight?.checks.map((check) => (
            <article className="check-row" key={check.id}>
              <StatusDot status={check.status} />
              <div>
                <strong>{check.label}</strong>
                <p>{check.message}</p>
              </div>
            </article>
          )) ?? <p className="empty-copy">Preflight pending.</p>}
        </div>
      </section>

      <section className="panel panel-wide">
        <div className="panel-heading compact">
          <div>
            <span className="eyebrow">Diff Preview</span>
            <h3>Local config changes</h3>
          </div>
          <FileDiff aria-hidden="true" size={18} />
        </div>
        <pre className="diff-view">{applyPlan?.diff ?? "No preview available."}</pre>
      </section>

      {connectionResult && (
        <section className="panel panel-wide">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Connection Test</span>
              <h3>{connectionResult.commandLabel}</h3>
            </div>
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
          <Terminal aria-hidden="true" className="panel-corner-icon" size={18} />
        </section>
      )}
    </div>
  );
}
