import { useState } from "react";
import { AppShell, type AppSection } from "./components/AppShell";
import { ProfilesSection } from "./features/profiles/ProfilesSection";
import { ProjectsSection } from "./features/projects/ProjectsSection";
import { SettingsSection } from "./features/settings/SettingsSection";
import { useWorkspace } from "./hooks/useWorkspace";

function App() {
  const [section, setSection] = useState<AppSection>("projects");
  const { actions, state } = useWorkspace();

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
          busy={state.busy}
          message={state.message}
          onAddProject={() => void actions.addProject()}
          onOpenProject={(project) => void actions.openProject(project)}
          onRemoveProject={(project) => void actions.removeProject(project)}
          onCloseProject={actions.closeProject}
          onLinkProfile={(profileId) => void actions.linkProfile(profileId)}
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
        />
      )}

      {section === "settings" && <SettingsSection />}
    </AppShell>
  );
}

export default App;
