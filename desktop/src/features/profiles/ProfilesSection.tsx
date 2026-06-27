import type { FormEvent } from "react";
import { PageHeader } from "../../components/PageHeader";
import type {
  GitIdentityProfile,
  ProfileInput,
  SshKeyStatus,
} from "../../domain/gitscope";
import { ProfilesPanel } from "./ProfilesPanel";

type ProfilesSectionProps = {
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

/**
 * Profiles library — a reusable set of git identity profiles that is NOT bound
 * to any project. Projects reference these; one profile can serve many projects.
 */
export function ProfilesSection(props: ProfilesSectionProps) {
  return (
    <>
      <PageHeader
        eyebrow="Reusable library"
        title="Profiles"
      />
      <ProfilesPanel {...props} />
    </>
  );
}
