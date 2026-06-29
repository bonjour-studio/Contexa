import { KeyRound, RotateCcw, Save } from "lucide-react";
import type { FormEvent } from "react";
import { ControlRow } from "../../components/Field";
import { emptyProfile, ProfileInput, SshKeyInfo } from "../../domain/gitscope";

type ProfileFormProps = {
  profileForm: ProfileInput;
  sshKeys: SshKeyInfo[];
  busy: boolean;
  onFormChange: (profile: ProfileInput) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
};

export function ProfileForm({
  profileForm,
  sshKeys,
  busy,
  onFormChange,
  onSave,
}: ProfileFormProps) {
  const keyOptions = sshKeys.map((key) => ({
    value: key.path,
    label: key.keyType ? `${key.name} · ${key.keyType}` : key.name,
  }));
  // Keep a profile's existing key selectable even if it is not in the scan.
  if (
    profileForm.sshKeyPath &&
    !sshKeys.some((key) => key.path === profileForm.sshKeyPath)
  ) {
    keyOptions.unshift({
      value: profileForm.sshKeyPath,
      label: profileForm.sshKeyPath,
    });
  }

  return (
    <form className="profile-form" onSubmit={onSave}>
      <section className="section">
        <div className="section-head">
          <span className="section-label">Details</span>
        </div>
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
                onFormChange({ ...profileForm, userName: event.currentTarget.value })
              }
              placeholder="Project Operator"
            />
          </ControlRow>
          <ControlRow label="user.email">
            <input
              value={profileForm.userEmail}
              onChange={(event) =>
                onFormChange({ ...profileForm, userEmail: event.currentTarget.value })
              }
              placeholder="operator@example.com"
            />
          </ControlRow>
          <ControlRow label="SSH key">
            <div className="select-shell">
              <KeyRound aria-hidden="true" size={15} />
              <select
                value={profileForm.sshKeyPath}
                onChange={(event) =>
                  onFormChange({
                    ...profileForm,
                    sshKeyPath: event.currentTarget.value,
                  })
                }
              >
                <option value="">Select an SSH key…</option>
                {keyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </ControlRow>
          <ControlRow label="Remote host">
            <input
              value={profileForm.remoteHost}
              onChange={(event) =>
                onFormChange({ ...profileForm, remoteHost: event.currentTarget.value })
              }
              placeholder="github.com"
            />
          </ControlRow>
        </div>
        {sshKeys.length === 0 && (
          <p className="empty-copy">
            No SSH keys yet — add or generate one under SSH Keys, then pick it
            here.
          </p>
        )}
      </section>

      <div className="form-actions">
        <button className="primary-action icon-button" disabled={busy} type="submit">
          <Save aria-hidden="true" size={15} />
          <span>Save profile</span>
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
  );
}
