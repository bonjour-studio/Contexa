import { PageHeader } from "../../components/PageHeader";
import { FieldRow } from "../../components/Field";

const APP_VERSION = "0.1.0";

/**
 * App-level settings. Minimal for v1 — about/version plus notes that explain
 * the app's window and security behavior. Real preferences arrive later.
 */
export function SettingsSection() {
  return (
    <div className="page">
      <PageHeader eyebrow="Application" title="Settings" />

      <section className="section">
        <div className="section-head">
          <span className="section-label">About</span>
        </div>
        <div className="group">
          <FieldRow label="Version">{APP_VERSION}</FieldRow>
          <FieldRow label="License">AGPL-3.0-or-later</FieldRow>
          <FieldRow label="Copyright">© 2026 Bonjour Studio</FieldRow>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-label">Window &amp; safety</span>
        </div>
        <div className="group">
          <div className="row stack">
            <span className="row-title">Window</span>
            <p className="row-note">
              Resizable with a minimum size; its size and position are remembered
              between launches.
            </p>
          </div>
          <div className="row stack">
            <span className="row-title">Safety</span>
            <p className="row-note">
              Local-first and reference-only — no secrets are stored and no global
              git or SSH config is changed.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
