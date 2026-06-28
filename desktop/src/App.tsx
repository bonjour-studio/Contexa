import { useEffect, useState } from "react";
import { AppShell, type AppSection } from "./components/AppShell";
import { emptyProfile, type SshKeyInfo } from "./domain/gitscope";
import { ProfilesSection } from "./features/profiles/ProfilesSection";
import { ProjectsSection } from "./features/projects/ProjectsSection";
import { SettingsSection } from "./features/settings/SettingsSection";
import { SshKeysSection } from "./features/ssh/SshKeysSection";
import { useWorkspace } from "./hooks/useWorkspace";

function App() {
  const [section, setSection] = useState<AppSection>("projects");
  const [profilesEditing, setProfilesEditing] = useState(false);
  const { actions, state } = useWorkspace();

  // Jump from a key into a prefilled "new profile" form.
  const useKeyForProfile = (key: SshKeyInfo) => {
    actions.setProfileForm({ ...emptyProfile, sshKeyPath: key.path });
    setProfilesEditing(true);
    setSection("profiles");
  };

  // Suppress the default WebView context menu (Reload / Inspect Element) so the
  // app feels native; specific elements opt back in with their own menus.
  useEffect(() => {
    const blockContextMenu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("contextmenu", blockContextMenu);
    return () => document.removeEventListener("contextmenu", blockContextMenu);
  }, []);

  return (
    <AppShell section={section} onSectionChange={setSection}>
      {section === "projects" && (
        <ProjectsSection
          projects={state.projects}
          projectStatuses={state.projectStatuses}
          openProject={state.openProject}
          openProjectStatus={state.openProjectStatus}
          profiles={state.profiles}
          linkedProfile={state.linkedProfile}
          identityState={state.identityState}
          projectHistory={state.projectHistory}
          applyPlan={state.applyPlan}
          preflight={state.preflight}
          connectionResult={state.connectionResult}
          busy={state.busy}
          message={state.message}
          onAddProject={() => void actions.addProject()}
          onOpenProject={(project) => void actions.openProject(project)}
          onRemoveProject={(project) => void actions.removeProject(project)}
          onCloseProject={actions.closeProject}
          onLinkProfile={(profileId) => void actions.linkProfile(profileId)}
          onApply={() => void actions.applyIdentity()}
          onTestSsh={() => void actions.runConnectionTest("ssh")}
          onTestRemote={() => void actions.runConnectionTest("remote")}
        />
      )}

      {section === "profiles" && (
        <ProfilesSection
          profiles={state.profiles}
          profileForm={state.profileForm}
          keyStatus={state.keyStatus}
          busy={state.busy}
          onFormChange={actions.setProfileForm}
          onSave={actions.saveProfile}
          onChooseSshKeyFile={() => void actions.chooseSshKeyFile()}
          onEdit={actions.editProfile}
          onDelete={(profile) => void actions.deleteProfile(profile)}
          editing={profilesEditing}
          onEditingChange={setProfilesEditing}
        />
      )}

      {section === "ssh" && (
        <SshKeysSection
          sshKeys={state.sshKeys}
          busy={state.busy}
          onRefresh={() => void actions.refreshSshKeys()}
          onAddKey={() => void actions.addSshKey()}
          onRemoveKey={(key) => void actions.removeSshKey(key)}
          onDeleteKey={(key) => void actions.deleteSshKey(key)}
          onGenerate={actions.generateSshKey}
          onCopyPublicKey={(key) => void actions.copyPublicKey(key)}
          onCopyPath={(key) => void actions.copyKeyPath(key)}
          onReveal={(key) => void actions.revealSshKey(key)}
          onUseForProfile={useKeyForProfile}
        />
      )}

      {section === "settings" && <SettingsSection />}
    </AppShell>
  );
}

export default App;
