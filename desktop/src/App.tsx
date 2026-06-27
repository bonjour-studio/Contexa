import { useState } from "react";
import { AppShell, type AppSection } from "./components/AppShell";
import { ProfilesSection } from "./features/profiles/ProfilesSection";
import { ProjectsSection } from "./features/projects/ProjectsSection";
import { SettingsSection } from "./features/settings/SettingsSection";
import { useGitScopeWorkspace } from "./hooks/useGitScopeWorkspace";

function App() {
  const [section, setSection] = useState<AppSection>("projects");
  const { actions, state } = useGitScopeWorkspace();

  return (
    <AppShell section={section} onSectionChange={setSection}>
      {section === "projects" && <ProjectsSection />}

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
