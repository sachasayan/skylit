import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "./ui/button";
import { SegmentedControl } from "./ui/segmented-control";
import {
  Input,
  Select,
  Textarea,
  Checkbox,
  Switch,
  Field,
  SettingRow,
} from "./ui/field";
import { Status } from "./ui/status";
function Showcase() {
  const [mode, setMode] = useState("light"),
    [palette, setPalette] = useState("linen"),
    [pace, setPace] = useState("10"),
    [enabled, setEnabled] = useState(true),
    [status, setStatus] = useState("Changes stay in this showcase."),
    [selection, setSelection] = useState(false);
  const tokens = (window as any).SkylitAppearance.tokens(palette, mode);
  const style = Object.fromEntries(
    Object.entries(tokens).map(([k, v]) => ["--" + k, v]),
  ) as React.CSSProperties;
  return (
    <main className="component-showcase" style={style}>
      <header>
        <p className="eyebrow">SKYLIT · COMPONENT LIBRARY</p>
        <h1>Skylit component library</h1>
        <p>
          Live components from the application. Try their selected, disabled,
          keyboard and feedback states.
        </p>
        <div className="showcase-toolbar">
          <SegmentedControl
            label="Showcase mode"
            value={mode}
            choices={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            onValueChange={setMode}
          />
          <Field id="showcase-palette" label="Palette">
            <Select
              value={palette}
              onChange={(e) => setPalette(e.target.value)}
            >
              {Object.keys((window as any).SkylitAppearance.palettes).map(
                (p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ),
              )}
            </Select>
          </Field>
        </div>
      </header>
      <div className="showcase-grid">
        <section>
          <h2>Actions</h2>
          <p>
            One primary action per task. Secondary actions stay quiet;
            destructive actions say what will happen.
          </p>
          <div className="showcase-actions">
            <Button
              onClick={() => setStatus("Layout applied in the showcase.")}
            >
              Apply layout
            </Button>
            <Button
              variant="secondary"
              onClick={() => setStatus("Changes cancelled.")}
            >
              Cancel changes
            </Button>
            <Button
              variant="ghost"
              onClick={() => setStatus("Help opened in the showcase.")}
            >
              Help
            </Button>
            <Button disabled>Saving…</Button>
            <Button
              variant="destructive"
              onClick={() => setStatus("Example only. No photos were removed.")}
            >
              Exclude picture
            </Button>
          </div>
          <Status>{status}</Status>
        </section>
        <section>
          <h2>Short choices</h2>
          <p>
            Show a few comparable options together. Selected state, arrow keys
            and touch share the same behavior.
          </p>
          <SegmentedControl
            label="Seconds per picture"
            value={pace}
            choices={["5", "10", "30", "60"].map((v) => ({
              value: v,
              label: v + " sec",
            }))}
            onValueChange={setPace}
          />
          <SegmentedControl
            label="Unavailable choice"
            value="automatic"
            choices={[
              { value: "manual", label: "Manual" },
              { value: "automatic", label: "Automatic" },
            ]}
            onValueChange={() => {}}
            disabled
          />
        </section>
        <section>
          <h2>Preferences & selection</h2>
          <SettingRow
            label="Resume slideshow"
            description="Continue from the last picture."
          >
            <Switch
              aria-label="Resume slideshow"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          </SettingRow>
          <SettingRow
            label="Select picture"
            description="A checkbox selects an item for another action."
          >
            <Checkbox
              aria-label="Select picture"
              checked={selection}
              onChange={(e) => setSelection(e.target.checked)}
            />
          </SettingRow>
          <SettingRow label="Unavailable preference">
            <Switch aria-label="Unavailable preference" disabled />
          </SettingRow>
        </section>
        <section>
          <h2>Fields</h2>
          <div className="showcase-fields">
            <Field
              id="example-name"
              label="Calendar name"
              description="A name everyone in the household recognizes."
            >
              <Input placeholder="Family plans" />
            </Field>
            <Field
              id="example-error"
              label="City"
              error="Choose a city from the search results."
            >
              <Input defaultValue="Example city" />
            </Field>
            <Field id="example-disabled" label="Unavailable field">
              <Input disabled value="Available on the frame" readOnly />
            </Field>
            <Field id="example-note" label="Household note">
              <Textarea rows={2} placeholder="A short note for today" />
            </Field>
          </div>
        </section>
      </div>
      <section className="showcase-guidance">
        <h2>Which control belongs here?</h2>
        <p>
          <strong>Switch:</strong> an immediately applied on/off preference.{" "}
          <strong>Checkbox:</strong> selection or explicit consent.{" "}
          <strong>Segments:</strong> a small set of comparable choices.{" "}
          <strong>Visual cards:</strong> palettes, layouts and slideshow styles
          where appearance is the decision. <strong>Select:</strong> longer
          lists such as hours or named calendars.
        </p>
        <p>
          Keep artwork and dashboard composition intact. Shared controls
          establish consistency; they do not decide the information architecture
          for us.
        </p>
        <p>
          <a href="index.html">Read the implementation report →</a>
        </p>
      </section>
    </main>
  );
}
createRoot(document.getElementById("showcase")!).render(<Showcase />);
