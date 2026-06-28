import { Users } from "lucide-react";
import { FieldRow } from "../../components/Field";
import { PathText } from "../../components/PathText";
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
    <>
      <section className="section">
        <div className="section-head">
          <span className="section-label">Repository</span>
          {status && <StatusBadge status="passed" label="Git ready" />}
        </div>
        <div className="group">
          <FieldRow label="Branch">
            {status?.repository.currentBranch ?? "No branch"}
          </FieldRow>
          <FieldRow label="user.name">{status?.config.userName ?? "Unset"}</FieldRow>
          <FieldRow label="user.email">
            {status?.config.userEmail ? (
              <PathText value={status.config.userEmail} mono={false} />
            ) : (
              "Unset"
            )}
          </FieldRow>
          <FieldRow label="SSH key">
            {status?.config.inferredSshKeyPath ? (
              <PathText value={status.config.inferredSshKeyPath} tilde />
            ) : (
              "Unset"
            )}
          </FieldRow>
          <FieldRow label="Remote">
            {status?.repository.remote?.url ? (
              <PathText value={status.repository.remote.url} />
            ) : (
              "No remote"
            )}
          </FieldRow>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-label">Identity</span>
          {linkedProfile && status && (
            <StatusBadge status={identityBadge} label={identityLabel} />
          )}
        </div>
        <div className="group">
          <div className="row control">
            <span className="field-label">Profile</span>
            <div className="field-value">
              <div className="select-shell">
                <Users aria-hidden="true" size={15} />
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
            </div>
          </div>

          {linkedProfile ? (
            <>
              <FieldRow label="Name">{linkedProfile.userName}</FieldRow>
              <FieldRow label="Email">
                <PathText value={linkedProfile.userEmail} mono={false} />
              </FieldRow>
              <FieldRow label="Host">{linkedProfile.remoteHost}</FieldRow>
            </>
          ) : (
            <div className="row">
              <span className="empty-copy">
                {profiles.length === 0
                  ? "Create a profile under Profiles, then link it here."
                  : "Link a profile to compare and apply its git identity."}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-label">Recent activity</span>
          {history.length > 0 && (
            <span className="section-count">{history.length}</span>
          )}
        </div>
        <div className="group">
          {history.length === 0 ? (
            <div className="row">
              <span className="empty-copy">No identity applied yet.</span>
            </div>
          ) : (
            history.slice(0, 6).map((item) => (
              <div className="row" key={item.id}>
                <span className="field-value">{item.profileLabel}</span>
                <time className="row-time">{formatDate(item.appliedAt)}</time>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
