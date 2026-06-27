import { AppShell } from "./components/AppShell";
import { OverviewPanel } from "./features/workspace/OverviewPanel";
import { ProfilesPanel } from "./features/workspace/ProfilesPanel";
import { ReviewPanel } from "./features/workspace/ReviewPanel";
import { useGitScopeWorkspace } from "./hooks/useGitScopeWorkspace";

function App() {
  const { actions, state } = useGitScopeWorkspace();

  return (
    <AppShell
      busy={state.busy}
      message={state.message}
      profiles={state.profiles}
      repoPath={state.repoPath}
      selectedProfileId={state.selectedProfileId}
      status={state.status}
      tab={state.tab}
      onChooseRepositoryDirectory={() => void actions.chooseRepositoryDirectory()}
      onSelectedProfileChange={actions.setSelectedProfileId}
      onTabChange={actions.setTab}
    >
      {state.tab === "overview" && (
        <OverviewPanel
          status={state.status}
          selectedProfile={state.selectedProfile}
          identityMatch={state.identityMatch}
          history={state.history}
          onOpenReview={() => actions.setTab("review")}
        />
      )}

      {state.tab === "profiles" && (
        <ProfilesPanel
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

      {state.tab === "review" && (
        <ReviewPanel
          status={state.status}
          selectedProfile={state.selectedProfile}
          applyPlan={state.applyPlan}
          preflight={state.preflight}
          connectionResult={state.connectionResult}
          busy={state.busy}
          onApply={() => void actions.applySelectedProfile()}
          onTestSsh={() => void actions.runConnectionTest("ssh")}
          onTestRemote={() => void actions.runConnectionTest("remote")}
          onOpenProfiles={() => actions.setTab("profiles")}
        />
      )}
    </AppShell>
  );
}

export default App;
