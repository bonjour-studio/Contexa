import { Info, Maximize2, ShieldCheck } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";

const APP_VERSION = "0.1.0";

/**
 * App-level settings. Minimal for v1 — about/version plus notes that explain
 * the app's window and security behavior. Real preferences arrive later.
 */
export function SettingsSection() {
  return (
    <>
      <PageHeader eyebrow="Application" title="Settings" />

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">About</span>
              <h3>Contexa</h3>
            </div>
            <Info aria-hidden="true" size={18} />
          </div>
          <dl className="compact-list">
            <div>
              <dt>Version</dt>
              <dd>{APP_VERSION}</dd>
            </div>
            <div>
              <dt>License</dt>
              <dd>AGPL-3.0-or-later</dd>
            </div>
            <div>
              <dt>Copyright</dt>
              <dd>© 2026 Bonjour Studio</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">Behavior</span>
              <h3>Window &amp; safety</h3>
            </div>
          </div>
          <dl className="compact-list">
            <div>
              <dt>
                <Maximize2 aria-hidden="true" size={14} /> Window
              </dt>
              <dd>
                Resizable with a minimum size; its size and position are
                remembered between launches.
              </dd>
            </div>
            <div>
              <dt>
                <ShieldCheck aria-hidden="true" size={14} /> Safety
              </dt>
              <dd>
                Local-first and reference-only — no secrets are stored and no
                global git or SSH config is changed.
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}
