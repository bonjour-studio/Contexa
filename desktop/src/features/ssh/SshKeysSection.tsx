import {
  ArrowLeft,
  Clipboard,
  ClipboardCopy,
  FilePlus2,
  FolderOpen,
  Hash,
  KeyRound,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { ContextMenu } from "../../components/ContextMenu";
import { ControlRow } from "../../components/Field";
import { PageHeader } from "../../components/PageHeader";
import { PathText } from "../../components/PathText";
import type {
  GenerateKeyInput,
  SshKeyInfo,
  SshKeyType,
} from "../../domain/gitscope";

type SshKeysSectionProps = {
  sshKeys: SshKeyInfo[];
  busy: boolean;
  onRefresh: () => void;
  onAddKey: () => void;
  onRemoveKey: (key: SshKeyInfo) => void;
  onDeleteKey: (key: SshKeyInfo) => void;
  onGenerate: (input: GenerateKeyInput) => Promise<boolean>;
  onCopyPublicKey: (key: SshKeyInfo) => void;
  onCopyPath: (key: SshKeyInfo) => void;
  onReveal: (key: SshKeyInfo) => void;
  onUseForProfile: (key: SshKeyInfo) => void;
};

type MenuState = { key: SshKeyInfo; x: number; y: number };

export function SshKeysSection({
  sshKeys,
  busy,
  onRefresh,
  onAddKey,
  onRemoveKey,
  onDeleteKey,
  onGenerate,
  onCopyPublicKey,
  onCopyPath,
  onReveal,
  onUseForProfile,
}: SshKeysSectionProps) {
  const [generating, setGenerating] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);

  useEffect(() => {
    onRefresh();
    // Scan once when the section opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (generating) {
    return (
      <GenerateView
        busy={busy}
        onBack={() => setGenerating(false)}
        onGenerate={async (input) => {
          if (await onGenerate(input)) setGenerating(false);
        }}
      />
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Security"
        title="SSH Keys"
        actions={
          <>
            <button
              className="icon-button"
              disabled={busy}
              onClick={onAddKey}
              type="button"
            >
              <FilePlus2 aria-hidden="true" size={15} />
              <span>Add key</span>
            </button>
            <button
              className="primary-action icon-button"
              onClick={() => setGenerating(true)}
              type="button"
            >
              <Plus aria-hidden="true" size={15} />
              <span>Generate</span>
            </button>
          </>
        }
      />

      {sshKeys.length === 0 ? (
        <section className="group">
          <div className="empty-block">
            <KeyRound aria-hidden="true" size={24} />
            <h3>No SSH keys found</h3>
            <p className="empty-copy">
              Keys in ~/.ssh show up here automatically. Add a key from another
              folder, or generate a new one.
            </p>
          </div>
        </section>
      ) : (
        <div className="group">
          {sshKeys.map((key) => {
            const open = (x: number, y: number) => setMenu({ key, x, y });
            const typeLabel = key.keyType
              ? key.keyType.toUpperCase() +
                (key.bits && key.keyType.toLowerCase() !== "ed25519"
                  ? ` ${key.bits}`
                  : "")
              : "Unknown";

            return (
              <div
                className="list-row"
                key={key.path}
                onContextMenu={(event) => {
                  event.preventDefault();
                  open(event.clientX, event.clientY);
                }}
              >
                <button
                  className="row-open"
                  onClick={(event) => open(event.clientX, event.clientY)}
                  type="button"
                >
                  <KeyRound className="row-lead" aria-hidden="true" size={16} />
                  <span className="row-title">{key.name}</span>
                  <PathText
                    className="row-sub"
                    value={key.comment || key.fingerprint || key.path}
                  />
                  <div className="row-meta">
                    <span>{typeLabel}</span>
                    {key.source === "manual" && <span>Manual</span>}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          {menu.key.hasPublic && (
            <button
              className="context-menu-item"
              type="button"
              onClick={() => {
                onCopyPublicKey(menu.key);
                setMenu(null);
              }}
            >
              <ClipboardCopy aria-hidden="true" size={15} />
              <span>Copy public key</span>
            </button>
          )}
          <button
            className="context-menu-item"
            type="button"
            onClick={() => {
              onCopyPath(menu.key);
              setMenu(null);
            }}
          >
            <Clipboard aria-hidden="true" size={15} />
            <span>Copy path</span>
          </button>
          <button
            className="context-menu-item"
            type="button"
            onClick={() => {
              onReveal(menu.key);
              setMenu(null);
            }}
          >
            <FolderOpen aria-hidden="true" size={15} />
            <span>Reveal in Finder</span>
          </button>
          <div className="context-menu-separator" />
          <button
            className="context-menu-item"
            type="button"
            onClick={() => {
              onUseForProfile(menu.key);
              setMenu(null);
            }}
          >
            <UserPlus aria-hidden="true" size={15} />
            <span>Use for new profile</span>
          </button>
          <div className="context-menu-separator" />
          {menu.key.source === "manual" && (
            <button
              className="context-menu-item"
              type="button"
              onClick={() => {
                onRemoveKey(menu.key);
                setMenu(null);
              }}
            >
              <X aria-hidden="true" size={15} />
              <span>Remove from list</span>
            </button>
          )}
          <button
            className="context-menu-item danger"
            type="button"
            onClick={() => {
              onDeleteKey(menu.key);
              setMenu(null);
            }}
          >
            <Trash2 aria-hidden="true" size={15} />
            <span>Delete from disk</span>
          </button>
        </ContextMenu>
      )}
    </div>
  );
}

function GenerateView({
  busy,
  onBack,
  onGenerate,
}: {
  busy: boolean;
  onBack: () => void;
  onGenerate: (input: GenerateKeyInput) => void;
}) {
  const [name, setName] = useState("id_ed25519");
  const [keyType, setKeyType] = useState<SshKeyType>("ed25519");
  const [bits, setBits] = useState(4096);
  const [comment, setComment] = useState("");
  const [passphrase, setPassphrase] = useState("");

  const showBits = keyType !== "ed25519";
  const bitsOptions =
    keyType === "rsa" ? [2048, 3072, 4096] : keyType === "ecdsa" ? [256, 384, 521] : [];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onGenerate({
      name: name.trim(),
      keyType,
      bits: showBits ? bits : null,
      comment: comment.trim(),
      passphrase,
    });
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="SSH Keys"
        title="Generate key"
        actions={
          <button className="icon-button" onClick={onBack} type="button">
            <ArrowLeft aria-hidden="true" size={15} />
            <span>All keys</span>
          </button>
        }
      />
      <form className="profile-form" onSubmit={submit}>
        <section className="section">
          <div className="section-head">
            <span className="section-label">New key</span>
          </div>
          <div className="group">
            <ControlRow label="File name">
              <input
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="id_ed25519"
              />
            </ControlRow>
            <ControlRow label="Type">
              <div className="select-shell">
                <KeyRound aria-hidden="true" size={15} />
                <select
                  value={keyType}
                  onChange={(event) => {
                    const next = event.currentTarget.value as SshKeyType;
                    setKeyType(next);
                    if (next === "ecdsa") setBits(256);
                    if (next === "rsa") setBits(4096);
                  }}
                >
                  <option value="ed25519">Ed25519</option>
                  <option value="rsa">RSA</option>
                  <option value="ecdsa">ECDSA</option>
                </select>
              </div>
            </ControlRow>
            {showBits && (
              <ControlRow label="Bits">
                <div className="select-shell">
                  <Hash aria-hidden="true" size={15} />
                  <select
                    value={bits}
                    onChange={(event) => setBits(Number(event.currentTarget.value))}
                  >
                    {bitsOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </ControlRow>
            )}
            <ControlRow label="Comment">
              <input
                value={comment}
                onChange={(event) => setComment(event.currentTarget.value)}
                placeholder="you@example.com"
              />
            </ControlRow>
            <ControlRow label="Passphrase">
              <input
                type="password"
                value={passphrase}
                onChange={(event) => setPassphrase(event.currentTarget.value)}
                placeholder="Optional"
              />
            </ControlRow>
          </div>
        </section>

        <div className="form-actions">
          <button
            className="primary-action icon-button"
            disabled={busy || !name.trim()}
            type="submit"
          >
            <Sparkles aria-hidden="true" size={15} />
            <span>Generate key</span>
          </button>
        </div>
        <p className="empty-copy">
          Created in ~/.ssh via ssh-keygen. An existing key with the same name is
          never overwritten.
        </p>
      </form>
    </div>
  );
}
