import {
  GitBranch,
  History,
  KeyRound,
  Mail,
  Server,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import type {
  ApplyHistoryItem,
  GitIdentityProfile,
  RepositoryStatus,
} from "../../domain/gitscope";
import { formatDate } from "../../lib/format";

export type IdentityState = "matched" | "drift" | "unlinked";

type ProjectOverviewProps = {
  status: RepositoryStatus | null;
  profiles: GitIdentityProfile[];
  linkedProfile: GitIdentityProfile | null;
  identityState: IdentityState;
  history: ApplyHistoryItem[];
  busy: boolean;
  onLinkProfile: (profileId: string | null) => void;
};

export function ProjectOverview({
  status,
  profiles,
  linkedProfile,
  identityState,
  history,
  busy,
  onLinkProfile,
}: ProjectOverviewProps) {
  const identityLabel = !status
    ? "No repo"
    : identityState === "matched"
      ? "Matched"
      : identityState === "drift"
        ? "Drift"
        : "Unlinked";
  const identityBadge = identityState === "matched" && status ? "passed" : "warning";

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
        <MetricTile icon={ShieldCheck} label="Identity" value={identityLabel} />
        <MetricTile
          icon={History}
          label="Applies"
          value={String(history.length)}
        />
      </section>

      <div className="panel-grid">
        <section className="panel panel-wide">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Local Git Config</span>
              <h3>Repository identity</h3>
            </div>
            <StatusBadge status={identityBadge} label={identityLabel} />
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
        </section>

        <section className="panel">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">Linked Profile</span>
              <h3>{linkedProfile?.label ?? "None"}</h3>
            </div>
            {linkedProfile && status && (
              <StatusBadge status={identityBadge} label={identityLabel} />
            )}
          </div>

          <label>
            Apply identity from
            <div className="select-shell">
              <Users aria-hidden="true" size={16} />
              <select
                disabled={busy || profiles.length === 0}
                onChange={(event) =>
                  onLinkProfile(event.currentTarget.value || null)
                }
                value={linkedProfile?.id ?? ""}
              >
                <option value="">No profile</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          {linkedProfile ? (
            <dl className="compact-list">
              <DetailItem icon={User} label="Name">
                {linkedProfile.userName}
              </DetailItem>
              <DetailItem icon={Mail} label="Email">
                {linkedProfile.userEmail}
              </DetailItem>
              <DetailItem icon={Server} label="Host">
                {linkedProfile.remoteHost}
              </DetailItem>
            </dl>
          ) : (
            <p className="empty-copy">
              {profiles.length === 0
                ? "Create a profile under Profiles, then link it here."
                : "Link a profile to compare and apply its git identity."}
            </p>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">Apply History</span>
              <h3>This project</h3>
            </div>
          </div>

          {history.length === 0 ? (
            <p className="empty-copy">No identity applied yet.</p>
          ) : (
            <div className="history-list">
              {history.slice(0, 5).map((item) => (
                <article key={item.id} className="history-item">
                  <strong>{item.profileLabel}</strong>
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
  children: ReactNode;
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
