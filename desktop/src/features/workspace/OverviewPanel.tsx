import {
  ArrowRight,
  GitBranch,
  History,
  KeyRound,
  Mail,
  Server,
  ShieldCheck,
  User,
} from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import type {
  ApplyHistoryItem,
  GitIdentityProfile,
  RepositoryStatus,
} from "../../domain/gitscope";
import { formatDate, shortPath } from "../../lib/format";

type OverviewPanelProps = {
  status: RepositoryStatus | null;
  selectedProfile: GitIdentityProfile | null;
  identityMatch: boolean;
  history: ApplyHistoryItem[];
  onOpenReview: () => void;
};

export function OverviewPanel({
  status,
  selectedProfile,
  identityMatch,
  history,
  onOpenReview,
}: OverviewPanelProps) {
  return (
    <div className="overview-stack">
      <section className="status-strip">
        <MetricTile
          icon={GitBranch}
          label="Branch"
          value={status?.repository.currentBranch ?? "No branch"}
        />
        <MetricTile
          icon={Server}
          label="Remote"
          value={status?.repository.remote?.host ?? "No remote"}
        />
        <MetricTile
          icon={History}
          label="Applies"
          value={String(history.length)}
        />
        <MetricTile
          icon={ShieldCheck}
          label="Identity"
          value={identityMatch ? "Matched" : "Review"}
        />
      </section>

      <div className="panel-grid">
        <section className="panel panel-wide">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Local Git Config</span>
              <h3>Repository identity</h3>
            </div>
            <StatusBadge
              status={identityMatch ? "passed" : "warning"}
              label={identityMatch ? "Matched" : "Needs Review"}
            />
          </div>

          <dl className="identity-grid">
            <DetailItem icon={User} label="user.name">
              {status?.config.userName ?? "Unset"}
            </DetailItem>
            <DetailItem icon={Mail} label="user.email">
              {status?.config.userEmail ?? "Unset"}
            </DetailItem>
            <DetailItem icon={KeyRound} label="SSH key">
              {status?.config.inferredSshKeyPath ?? "Unset"}
            </DetailItem>
            <DetailItem icon={Server} label="Remote">
              {status?.repository.remote?.url ?? "No remote"}
            </DetailItem>
          </dl>

          <button
            className="primary-action icon-button"
            disabled={!selectedProfile || !status}
            onClick={onOpenReview}
            type="button"
          >
            <ArrowRight aria-hidden="true" size={17} />
            <span>Review plan</span>
          </button>
        </section>

        <section className="panel">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">Selected Profile</span>
              <h3>{selectedProfile?.label ?? "None"}</h3>
            </div>
          </div>

          {selectedProfile ? (
            <dl className="compact-list">
              <DetailItem icon={User} label="Name">
                {selectedProfile.userName}
              </DetailItem>
              <DetailItem icon={Mail} label="Email">
                {selectedProfile.userEmail}
              </DetailItem>
              <DetailItem icon={Server} label="Host">
                {selectedProfile.remoteHost}
              </DetailItem>
            </dl>
          ) : (
            <p className="empty-copy">No profile selected.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">Apply History</span>
              <h3>Recent changes</h3>
            </div>
          </div>

          {history.length === 0 ? (
            <p className="empty-copy">No profile has been applied.</p>
          ) : (
            <div className="history-list">
              {history.slice(0, 5).map((item) => (
                <article key={item.id} className="history-item">
                  <strong>{item.profileLabel}</strong>
                  <span>{shortPath(item.repoPath)}</span>
                  <time>{formatDate(item.appliedAt)}</time>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GitBranch;
  label: string;
  value: string;
}) {
  return (
    <article className="metric-tile">
      <Icon aria-hidden="true" size={18} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function DetailItem({
  children,
  icon: Icon,
  label,
}: {
  children: string;
  icon: typeof User;
  label: string;
}) {
  return (
    <div className="detail-item">
      <Icon aria-hidden="true" size={16} />
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
