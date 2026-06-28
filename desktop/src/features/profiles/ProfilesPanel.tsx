import { Edit3, KeyRound, RotateCcw, Save, Server, Trash2, User } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import {
  emptyProfile,
  GitIdentityProfile,
  ProfileInput,
  SshKeyStatus,
} from "../../domain/gitscope";

type ProfilesPanelProps = {
  profiles: GitIdentityProfile[];
  profileForm: ProfileInput;
  keyStatus: SshKeyStatus | null;
  busy: boolean;
  onFormChange: (profile: ProfileInput) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onChooseSshKeyFile: () => void;
  onEdit: (profile: GitIdentityProfile) => void;
  onDelete: (profile: GitIdentityProfile) => void;
};

export function ProfilesPanel({
  profiles,
  profileForm,
  keyStatus,
  busy,
  onFormChange,
  onSave,
  onChooseSshKeyFile,
  onEdit,
  onDelete,
}: ProfilesPanelProps) {
  const keyReady =
    keyStatus?.exists && keyStatus.isFile && keyStatus.readable;

  return (
    <>
      <section className="section">
        <div className="section-head">
          <span className="section-label">Saved profiles</span>
          {profiles.length > 0 && (
            <span className="section-count">{profiles.length}</span>
          )}
        </div>
        <div className="group">
          {profiles.length === 0 ? (
            <div className="row">
              <span className="empty-copy">No profiles saved yet.</span>
            </div>
          ) : (
            profiles.map((profile) => (
              <div className="list-row" key={profile.id}>
                <button
                  className="row-open"
                  onClick={() => onEdit(profile)}
                  type="button"
                >
                  <User className="row-lead" aria-hidden="true" size={16} />
                  <span className="row-title">{profile.label}</span>
                  <span className="row-sub">{profile.userName}</span>
                </button>
                <div className="row-trailing">
                  <div className="row-meta">
                    <span>
                      <Server aria-hidden="true" size={13} />
                      {profile.remoteHost}
                    </span>
                  </div>
                  <div className="row-actions">
                    <button
                      className="icon-only-button"
                      type="button"
                      onClick={() => onEdit(profile)}
                      title="Edit profile"
                    >
                      <Edit3 aria-hidden="true" size={15} />
                    </button>
                    <button
                      className="danger-action icon-only-button"
                      type="button"
                      onClick={() => onDelete(profile)}
                      title="Delete profile"
                    >
                      <Trash2 aria-hidden="true" size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-label">
            {profileForm.id ? "Edit profile" : "New profile"}
          </span>
        </div>
        <form className="profile-form" onSubmit={onSave}>
          <div className="group">
            <ControlRow label="Label">
              <input
                value={profileForm.label}
                onChange={(event) =>
                  onFormChange({ ...profileForm, label: event.currentTarget.value })
                }
                placeholder="Work"
              />
            </ControlRow>
            <ControlRow label="user.name">
              <input
                value={profileForm.userName}
                onChange={(event) =>
                  onFormChange({
                    ...profileForm,
                    userName: event.currentTarget.value,
                  })
                }
                placeholder="Project Operator"
              />
            </ControlRow>
            <ControlRow label="user.email">
              <input
                value={profileForm.userEmail}
                onChange={(event) =>
                  onFormChange({
                    ...profileForm,
                    userEmail: event.currentTarget.value,
                  })
                }
                placeholder="operator@example.com"
              />
            </ControlRow>
            <ControlRow label="SSH key">
              <div className="inline-control">
                <input
                  readOnly
                  value={profileForm.sshKeyPath}
                  placeholder="Choose an SSH key file"
                  title={profileForm.sshKeyPath || undefined}
                />
                <button
                  className="icon-only-button"
                  type="button"
                  onClick={onChooseSshKeyFile}
                  title="Choose SSH key file"
                >
                  <KeyRound aria-hidden="true" size={15} />
                </button>
              </div>
            </ControlRow>
            <ControlRow label="Remote host">
              <input
                value={profileForm.remoteHost}
                onChange={(event) =>
                  onFormChange({
                    ...profileForm,
                    remoteHost: event.currentTarget.value,
                  })
                }
                placeholder="github.com"
              />
            </ControlRow>
            {keyStatus && (
              <div className="row">
                <StatusBadge
                  status={keyReady ? "passed" : "failed"}
                  label={keyReady ? "Key ready" : "Key issue"}
                />
                <span
                  className="field-value"
                  title={keyStatus.message ?? keyStatus.expandedPath}
                >
                  {keyStatus.message ?? keyStatus.expandedPath}
                </span>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button className="primary-action icon-button" disabled={busy} type="submit">
              <Save aria-hidden="true" size={15} />
              <span>Save</span>
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={() => onFormChange(emptyProfile)}
              disabled={busy}
            >
              <RotateCcw aria-hidden="true" size={15} />
              <span>Clear</span>
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

function ControlRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="row control">
      <span className="field-label">{label}</span>
      {children}
    </div>
  );
}
