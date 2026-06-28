import { KeyRound, RotateCcw, Save } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import { emptyProfile, ProfileInput, SshKeyStatus } from "../../domain/gitscope";

type ProfileFormProps = {
  profileForm: ProfileInput;
  keyStatus: SshKeyStatus | null;
  busy: boolean;
  onFormChange: (profile: ProfileInput) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onChooseSshKeyFile: () => void;
};

export function ProfileForm({
  profileForm,
  keyStatus,
  busy,
  onFormChange,
  onSave,
  onChooseSshKeyFile,
}: ProfileFormProps) {
  const keyReady = keyStatus?.exists && keyStatus.isFile && keyStatus.readable;

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
                onFormChange({ ...profileForm, remoteHost: event.currentTarget.value })
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

function ControlRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="row control">
      <span className="field-label">{label}</span>
      {children}
    </div>
  );
}
