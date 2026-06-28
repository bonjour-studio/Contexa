import { Edit3, Server, Trash2, User } from "lucide-react";
import { useState } from "react";
import { ContextMenu } from "../../components/ContextMenu";
import type { GitIdentityProfile } from "../../domain/gitscope";

type ProfileListProps = {
  profiles: GitIdentityProfile[];
  onEdit: (profile: GitIdentityProfile) => void;
  onDelete: (profile: GitIdentityProfile) => void;
};

type MenuState = { profile: GitIdentityProfile; x: number; y: number };

export function ProfileList({ profiles, onEdit, onDelete }: ProfileListProps) {
  const [menu, setMenu] = useState<MenuState | null>(null);

  if (profiles.length === 0) {
    return (
      <section className="group">
        <div className="empty-block">
          <User aria-hidden="true" size={24} />
          <h3>No profiles yet</h3>
          <p className="empty-copy">
            Create a reusable git identity — name, email, SSH key and host — then
            link it to any project.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="group">
        {profiles.map((profile) => (
          <div
            className="list-row"
            key={profile.id}
            onContextMenu={(event) => {
              event.preventDefault();
              setMenu({ profile, x: event.clientX, y: event.clientY });
            }}
          >
            <button
              className="row-open"
              onClick={() => onEdit(profile)}
              type="button"
            >
              <User className="row-lead" aria-hidden="true" size={16} />
              <span className="row-title">{profile.label}</span>
              <span className="row-sub">{profile.userName}</span>
              <div className="row-meta">
                <span>
                  <Server aria-hidden="true" size={13} />
                  {profile.remoteHost}
                </span>
              </div>
            </button>
          </div>
        ))}
      </div>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          <button
            className="context-menu-item"
            type="button"
            onClick={() => {
              onEdit(menu.profile);
              setMenu(null);
            }}
          >
            <Edit3 aria-hidden="true" size={15} />
            <span>Edit</span>
          </button>
          <div className="context-menu-separator" />
          <button
            className="context-menu-item danger"
            type="button"
            onClick={() => {
              onDelete(menu.profile);
              setMenu(null);
            }}
          >
            <Trash2 aria-hidden="true" size={15} />
            <span>Delete</span>
          </button>
        </ContextMenu>
      )}
    </>
  );
}
