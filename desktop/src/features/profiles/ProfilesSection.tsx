import { ArrowLeft, Plus } from "lucide-react";
import type { FormEvent } from "react";
import { PageHeader } from "../../components/PageHeader";
import {
  emptyProfile,
  GitIdentityProfile,
  ProfileInput,
  SshKeyStatus,
} from "../../domain/gitscope";
import { ProfileForm } from "./ProfileForm";
import { ProfileList } from "./ProfileList";

type ProfilesSectionProps = {
  profiles: GitIdentityProfile[];
  profileForm: ProfileInput;
  keyStatus: SshKeyStatus | null;
  busy: boolean;
  onFormChange: (profile: ProfileInput) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onChooseSshKeyFile: () => void;
  onEdit: (profile: GitIdentityProfile) => void;
  onDelete: (profile: GitIdentityProfile) => void;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
};

/**
 * Profiles library — two-level navigation like Projects: the main page is just
 * the list of saved identities with an "Add profile" entry; creating or editing
 * opens a dedicated form page.
 */
export function ProfilesSection({
  profiles,
  profileForm,
  keyStatus,
  busy,
  onFormChange,
  onSave,
  onChooseSshKeyFile,
  onEdit,
  onDelete,
  editing,
  onEditingChange,
}: ProfilesSectionProps) {
  const startAdd = () => {
    onFormChange(emptyProfile);
    onEditingChange(true);
  };

  const startEdit = (profile: GitIdentityProfile) => {
    onEdit(profile);
    onEditingChange(true);
  };

  const back = () => {
    onFormChange(emptyProfile);
    onEditingChange(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    if (await onSave(event)) {
      onEditingChange(false);
    }
  };

  if (editing) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Profile"
          title={profileForm.id ? "Edit profile" : "New profile"}
          actions={
            <button className="icon-button" onClick={back} type="button">
              <ArrowLeft aria-hidden="true" size={15} />
              <span>All profiles</span>
            </button>
          }
        />
        <ProfileForm
          profileForm={profileForm}
          keyStatus={keyStatus}
          busy={busy}
          onFormChange={onFormChange}
          onSave={submit}
          onChooseSshKeyFile={onChooseSshKeyFile}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Reusable library"
        title="Profiles"
        actions={
          <button
            className="primary-action icon-button"
            onClick={startAdd}
            type="button"
          >
            <Plus aria-hidden="true" size={15} />
            <span>Add profile</span>
          </button>
        }
      />
      <ProfileList profiles={profiles} onEdit={startEdit} onDelete={onDelete} />
    </div>
  );
}
