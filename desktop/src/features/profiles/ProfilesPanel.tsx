import {
  Edit3,
  KeyRound,
  RotateCcw,
  Save,
  Server,
  Trash2,
  User,
} from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import {
  emptyProfile,
  GitIdentityProfile,
  ProfileInput,
  SshKeyStatus,
} from "../../domain/gitscope";
import type { FormEvent } from "react";

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
  return (
    <div className="profiles-layout">
      <section className="panel profile-editor">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Profile</span>
            <h3>{profileForm.id ? "Edit identity" : "Create identity"}</h3>
          </div>
        </div>

        <form className="profile-form" onSubmit={onSave}>
          <label>
            Label
            <input
              value={profileForm.label}
              onChange={(event) =>
                onFormChange({ ...profileForm, label: event.currentTarget.value })
              }
              placeholder="Work"
            />
          </label>
          <label>
            user.name
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
          </label>
          <label>
            user.email
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
          </label>
          <label>
            SSH private key path reference
            <div className="inline-control">
              <input
                readOnly
                value={profileForm.sshKeyPath}
                placeholder="Choose an SSH key file"
              />
              <button
                className="icon-only-button"
                type="button"
                onClick={onChooseSshKeyFile}
                title="Choose SSH key file"
              >
                <KeyRound aria-hidden="true" size={17} />
              </button>
            </div>
          </label>
          <label>
            Remote host
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
          </label>

          {keyStatus && (
            <div className="key-status">
              <StatusBadge
                status={
                  keyStatus.exists && keyStatus.isFile && keyStatus.readable
                    ? "passed"
                    : "failed"
                }
                label={
                  keyStatus.exists && keyStatus.isFile && keyStatus.readable
                    ? "Key Ready"
                    : "Key Issue"
                }
              />
              <span
                className="truncate"
                title={keyStatus.message ?? keyStatus.expandedPath}
              >
                {keyStatus.message ?? keyStatus.expandedPath}
              </span>
            </div>
          )}

          <div className="form-actions">
            <button className="primary-action icon-button" disabled={busy} type="submit">
              <Save aria-hidden="true" size={17} />
              <span>Save</span>
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={() => onFormChange(emptyProfile)}
              disabled={busy}
            >
              <RotateCcw aria-hidden="true" size={17} />
              <span>Clear</span>
            </button>
          </div>
        </form>
      </section>

      <section className="panel profiles-list-panel">
        <div className="panel-heading compact">
          <div>
            <span className="eyebrow">Saved Profiles</span>
            <h3>{profiles.length} identities</h3>
          </div>
        </div>

        <div className="profile-list">
          {profiles.length === 0 ? (
            <p className="empty-copy">No profiles saved.</p>
          ) : (
            profiles.map((profile) => (
              <article className="profile-row" key={profile.id}>
                <div className="profile-row-main">
                  <User aria-hidden="true" size={17} />
                  <div>
                    <h4>{profile.label}</h4>
                    <p>{profile.userName}</p>
                    <span>
                      <Server aria-hidden="true" size={14} />
                      {profile.remoteHost}
                    </span>
                  </div>
                </div>
                <div className="row-actions">
                  <button
                    className="icon-only-button"
                    type="button"
                    onClick={() => onEdit(profile)}
                    title="Edit profile"
                  >
                    <Edit3 aria-hidden="true" size={16} />
                  </button>
                  <button
                    className="danger-action icon-only-button"
                    type="button"
                    onClick={() => onDelete(profile)}
                    title="Delete profile"
                  >
                    <Trash2 aria-hidden="true" size={16} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
