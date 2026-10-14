import { Disclosure, DisclosureTitle } from "./ui/disclosure";
import { Status } from "./ui/status";
import { Button } from "./ui/button";
import { NativeButton } from "./ui/button";
import { Input, Select, Textarea, Checkbox, Switch } from "./ui/field";
import type { ReactNode } from "react";
// Canonical uncontrolled forms; their service adapters remain the single write path.
const templates: Record<string, () => ReactNode> = {
  PhotoLibraryFrame: () => (
    <>
      <div className="photo-mail-head">
        <div>
          <p className="eyebrow">{"PICTURES ON THIS FRAME"}</p>
          <h2>{"Photo library"}</h2>
          <Status id="photo-mail-status" role="status"></Status>
        </div>
        <div className="photo-mail-actions">
          <Button type="submit" variant="default" id="photo-play">
            <span data-icon="play"></span>
            {"Slideshow"}
          </Button>
          <Button type="submit" variant="secondary" id="photo-check">
            {"Check now"}
          </Button>
        </div>
      </div>
      <Button type="submit" id="photo-undo" variant="ghost" hidden={true}>
        {"Undo exclusion"}
      </Button>
      <Status
        id="photo-curation-status"
        className="photo-curation-status"
        role="status"
      ></Status>
      <div className="photo-tiles" id="photo-tiles"></div>
      <p className="subtle small">
        {
          "Tap a picture to browse and zoom. Saved pictures stay on this frame; messages stay in your inbox."
        }
      </p>
    </>
  ),
  PhotoSettingsForm: () => (
    <>
      <DisclosureTitle>
        {"Photo settings "}
        <span aria-hidden="true">{"⌄"}</span>
      </DisclosureTitle>
      <div className="photo-settings-content">
        <p className="subtle small">
          {
            "Choose the source and how your slideshow looks. Email pictures use a dedicated Gmail account and an app password."
          }
        </p>
        <label htmlFor="photo-source">{"Photo source"}</label>
        <Select id="photo-source">
          <option value="album">{"Google Photos shared album"}</option>
          <option value="email">{"Pictures on this frame"}</option>
        </Select>
        <div id="photo-mail-setup">
          <label htmlFor="photo-email">{"Gmail address"}</label>
          <Input
            id="photo-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="Gmail address"
          />
          <label htmlFor="photo-password">{"Google app password"}</label>
          <Input
            id="photo-password"
            type="password"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="16-character app password"
          />
          <Button type="submit" id="photo-connect" variant="secondary">
            {"Connect and check mail"}
          </Button>
          <p className="tiny">
            {
              "The app password is encrypted in Android’s private storage. Skylit never shows it again or includes it in backups."
            }
          </p>
          <div className="photo-options">
            <div>
              <label htmlFor="photo-style">{"Slideshow style"}</label>
              <Select id="photo-style">
                <option value="fade">{"Soft fade"}</option>
                <option value="stack">{"Falling prints"}</option>
                <option value="collage">{"Photo collage"}</option>
                <option value="gentle">{"Gentle pan & zoom"}</option>
                <option value="still">{"Still gallery"}</option>
              </Select>
            </div>
            <div>
              <label htmlFor="photo-speed">{"Seconds per picture"}</label>
              <Select id="photo-speed">
                <option value="5">{"5"}</option>
                <option value="8">{"8"}</option>
                <option value="12">{"12"}</option>
                <option value="20">{"20"}</option>
                <option value="30">{"30"}</option>
                <option value="60">{"1 minute"}</option>
                <option value="300">{"5 minutes"}</option>
                <option value="900">{"15 minutes"}</option>
              </Select>
            </div>
            <div>
              <label htmlFor="photo-age">{"Keep pictures from"}</label>
              <Select id="photo-age">
                <option value="30">{"Last 30 days"}</option>
                <option value="90">{"Last 90 days"}</option>
              </Select>
            </div>
            <div>
              <label htmlFor="photo-limit">{"Maximum pictures"}</label>
              <Select id="photo-limit">
                <option value="5">{"5"}</option>
                <option value="10">{"10"}</option>
                <option value="20">{"20"}</option>
                <option value="30">{"30"}</option>
                <option value="40">{"40"}</option>
                <option value="50">{"50"}</option>
                <option value="100">{"100"}</option>
                <option value="200">{"200"}</option>
              </Select>
            </div>
          </div>
          <Button type="submit" id="photo-disconnect" variant="ghost">
            {"Disconnect email and erase saved pictures"}
          </Button>
          <Status
            id="photo-setup-status"
            className="small"
            role="status"
          ></Status>
        </div>
      </div>
    </>
  ),
  SlideshowHeading: () => (
    <>
      <h3>{"Slideshow"}</h3>
    </>
  ),
  PhotoRetention: () => (
    <>
      <label htmlFor="photo-retention">{"Gallery retention"}</label>
      <Select id="photo-retention">
        <optgroup label="By received date">
          <option value="d7">{"Last 7 days"}</option>
          <option value="d30">{"Last 30 days"}</option>
          <option value="d90">{"Last 90 days"}</option>
          <option value="d180">{"Last 180 days"}</option>
        </optgroup>
        <optgroup label="By photo count">
          <option value="n10">{"Last 10 photos"}</option>
          <option value="n20">{"Last 20 photos"}</option>
          <option value="n30">{"Last 30 photos"}</option>
          <option value="n40">{"Last 40 photos"}</option>
          <option value="n50">{"Last 50 photos"}</option>
          <option value="n100">{"Last 100 photos"}</option>
          <option value="n200">{"Last 200 photos"}</option>
        </optgroup>
      </Select>
      <p id="photo-retention-note" className="small subtle"></p>
    </>
  ),
  PictureChoices: () => (
    <>
      <DisclosureTitle>{"Local picture choices"}</DisclosureTitle>
      <p className="small subtle">
        {
          "Picture choices apply to pictures saved on this frame. They never delete email."
        }
      </p>
      <p id="photo-visibility" className="small subtle"></p>
      <div id="photo-choice-editor">
        <label htmlFor="photo-choice-select">{"Picture"}</label>
        <Select id="photo-choice-select"></Select>
        <div className="photo-choice-fields">
          <img id="photo-choice-preview" alt="Selected picture" />
          <div>
            <Button type="submit" id="photo-favourite" variant="secondary">
              {"Favourite"}
            </Button>
            <label className="cal-check">
              <Checkbox id="photo-hide" />
              {" Exclude from gallery"}
            </label>
            <label htmlFor="photo-fit">{"Picture framing"}</label>
            <Select id="photo-fit">
              <option value="contain">{"Fit · show the whole picture"}</option>
              <option value="cover">{"Fill · crop to the frame"}</option>
            </Select>
            <label htmlFor="photo-caption">{"Caption · on this frame"}</label>
            <Input id="photo-caption" maxLength={120} autoComplete="off" />
            <p id="photo-received" className="small subtle"></p>
          </div>
        </div>
      </div>
      <label className="cal-check">
        <Checkbox id="photo-show-hidden" />
        {" Show excluded pictures in the library"}
      </label>
      <Button type="submit" id="photo-restore-hidden" variant="secondary">
        {"Restore all excluded pictures"}
      </Button>
    </>
  ),
  PhotoPlayerFrame: () => (
    <>
      <div className="photo-player-stage">
        <img className="photo-slide" alt="Picture from your email" />
        <img className="photo-slide" alt="" aria-hidden="true" />
        <div className="photo-collage" aria-hidden="true">
          <img alt="" />
          <img alt="" />
          <img alt="" />
        </div>
      </div>
      <div className="photo-player-bar">
        <div className="photo-player-label">
          <strong id="photo-viewer-title">{"Family photos"}</strong>
          <span id="photo-counter"></span>
        </div>
        <div className="photo-player-controls">
          <NativeButton id="photo-prev" aria-label="Previous picture">
            {"‹"}
          </NativeButton>
          <NativeButton id="photo-pause" aria-label="Pause slideshow">
            {"Pause"}
          </NativeButton>
          <NativeButton id="photo-zoom" aria-label="Zoom into picture">
            {"Zoom"}
          </NativeButton>
          <NativeButton id="photo-next" aria-label="Next picture">
            {"›"}
          </NativeButton>
          <NativeButton id="photo-close" aria-label="Close slideshow">
            {"Close"}
          </NativeButton>
        </div>
      </div>
      <p id="photo-caption-display"></p>
      <span id="photo-idle-hint">{"Touch to return to your dashboard"}</span>
    </>
  ),
  CollectionSelector: () => (
    <>
      <label htmlFor="slideshow-collection">{"Play collection"}</label>
      <Select id="slideshow-collection"></Select>
      <div className="library-actions">
        <Button id="slideshow-preview" variant="secondary" type="button">
          {"Preview presentation"}
        </Button>
      </div>
      <Status
        id="library-status"
        className="library-status"
        role="status"
      ></Status>
    </>
  ),
  SlideshowComposition: () => (
    <>
      <div className="library-fields">
        <div>
          <label htmlFor="slideshow-layout">{"Composition"}</label>
          <Select id="slideshow-layout">
            <option value="auto">{"Automatic · pair portrait pictures"}</option>
            <option value="single">{"One picture"}</option>
            <option value="pair">{"Two pictures"}</option>
          </Select>
        </div>
        <div>
          <label htmlFor="slideshow-fit">{"Default framing"}</label>
          <Select id="slideshow-fit">
            <option value="contain">{"Fit · whole picture"}</option>
            <option value="cover">{"Fill · crop to canvas"}</option>
            <option value="auto">{"Automatic · avoid large crops"}</option>
          </Select>
        </div>
        <div>
          <label htmlFor="slideshow-background">{"Surrounding space"}</label>
          <Select id="slideshow-background">
            <option value="mat">{"Theme mat"}</option>
            <option value="black">{"Black"}</option>
            <option value="blur">{"Soft background from the picture"}</option>
          </Select>
        </div>
        <div>
          <label htmlFor="slideshow-transition">{"Transition duration"}</label>
          <Select id="slideshow-transition">
            <option value="0">{"No transition"}</option>
            <option value="300">{"Quick · 0.3 seconds"}</option>
            <option value="800">{"Soft · 0.8 seconds"}</option>
            <option value="1500">{"Slow · 1.5 seconds"}</option>
          </Select>
        </div>
        <div>
          <label htmlFor="slideshow-transition-type">{"Transition"}</label>
          <Select id="slideshow-transition-type">
            <option value="fade">{"Dissolve"}</option>
            <option value="cut">{"Cut"}</option>
            <option value="slide">{"Gentle slide"}</option>
            <option value="wipe">{"Reveal"}</option>
            <option value="mixed">{"Variety"}</option>
          </Select>
        </div>
        <div>
          <label htmlFor="slideshow-browse-speed">
            {"Browsing playback · seconds"}
          </label>
          <Input
            id="slideshow-browse-speed"
            type="number"
            min="5"
            max="300"
            step="1"
          />
        </div>
        <div>
          <label className="cal-check">
            <Switch id="slideshow-motion" />
            {" Allow gentle motion"}
          </label>
          <label className="cal-check">
            <Switch id="slideshow-resume" />
            {" Resume the previous photo"}
          </label>
        </div>
      </div>
      <p className="small subtle">
        {
          "Reduced motion always takes precedence. Manual browsing uses a single picture; ambient playback uses your chosen composition. Captions and configuration stay off the player."
        }
      </p>
    </>
  ),
  SlideshowSequence: () => (
    <>
      <div className="library-fields">
        <div>
          <label htmlFor="slideshow-order">{"Photo order"}</label>
          <Select id="slideshow-order">
            <option value="newest">{"Newest received first"}</option>
            <option value="oldest">{"Oldest received first"}</option>
            <option value="manual">{"My order"}</option>
            <option value="shuffle">{"Shuffle"}</option>
          </Select>
        </div>
        <div>
          <label className="cal-check">
            <Switch id="slideshow-new-first" />
            {" Queue new arrivals next"}
          </label>
          <label className="cal-check">
            <Switch id="slideshow-weighted" />
            {" Give favourites extra turns"}
          </label>
        </div>
      </div>
      <p className="small subtle">
        {
          "Shuffle keeps a stable queue during refresh. Previous follows what you actually saw. Favourite weighting may intentionally repeat favourites within a cycle."
        }
      </p>
      <Disclosure className="library-advanced">
        <DisclosureTitle>{"Arrange the collection"}</DisclosureTitle>
        <p className="small subtle">
          {"Drag by the grip, or use the up/down buttons."}
        </p>
        <div id="library-order-list" className="library-order-list"></div>
      </Disclosure>
    </>
  ),
  LibraryCuration: () => (
    <>
      <div className="library-fields">
        <div>
          <label htmlFor="library-query">{"Find a picture"}</label>
          <Input
            id="library-query"
            type="search"
            placeholder="Title, note or date"
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="library-filter">{"Show"}</label>
          <Select id="library-filter"></Select>
        </div>
      </div>
      <div className="library-actions">
        <Button id="library-select-all" variant="ghost" type="button">
          {"Select all matching"}
        </Button>
        <Button id="library-select-none" variant="ghost" type="button">
          {"Clear selection"}
        </Button>
        <span
          id="library-selected-count"
          className="library-selected-count"
        ></span>
      </div>
      <div id="library-grid" className="library-collection-grid"></div>
      <div className="library-actions">
        <Button id="library-keep" variant="secondary" type="button">
          {"Keep selected"}
        </Button>
        <Button id="library-unkeep" variant="ghost" type="button">
          {"Remove from Keepers"}
        </Button>
        <Button id="library-star" variant="ghost" type="button">
          {"Favourite"}
        </Button>
        <Button id="library-exclude" variant="ghost" type="button">
          {"Exclude"}
        </Button>
        <Button id="library-restore" variant="ghost" type="button">
          {"Restore"}
        </Button>
      </div>
      <div className="library-fields">
        <div>
          <label htmlFor="library-album-name">{"New collection"}</label>
          <Input
            id="library-album-name"
            maxLength={60}
            placeholder="Collection name"
          />
        </div>
        <div>
          <label htmlFor="library-album">{"Add to collection"}</label>
          <Select id="library-album"></Select>
        </div>
      </div>
      <div className="library-actions">
        <Button id="library-create-album" variant="secondary" type="button">
          {"Create with selected"}
        </Button>
        <Button id="library-add-album" variant="ghost" type="button">
          {"Add selected"}
        </Button>
        <Button id="library-remove-album" variant="ghost" type="button">
          {"Remove selected"}
        </Button>
        <Button id="library-delete-album" variant="ghost" type="button">
          {"Delete collection"}
        </Button>
      </div>
      <p className="small subtle">
        {
          "Up to 24 collections. Removing a collection never erases its pictures. Keepers survives recent-photo retention, within its own 100-picture / 128 MiB allowance."
        }
      </p>
      <Disclosure className="library-advanced">
        <DisclosureTitle>{"Possible similar pictures"}</DisclosureTitle>
        <p className="small subtle">
          {
            "A local visual signature suggests candidates. Review them yourself; no photo is automatically deleted or excluded."
          }
        </p>
        <div id="library-similar"></div>
      </Disclosure>
    </>
  ),
  PictureDetails: () => (
    <>
      <label htmlFor="library-edit-photo">{"Picture"}</label>
      <Select id="library-edit-photo"></Select>
      <div id="library-edit-fields">
        <div className="crop-preview">
          <img
            id="library-crop-preview"
            alt="Selected picture framing preview"
          />
        </div>
        <div className="library-fields">
          <div>
            <label htmlFor="library-title">{"Title"}</label>
            <Input id="library-title" maxLength={100} />
          </div>
          <div>
            <label htmlFor="library-description">
              {"Description for accessibility"}
            </label>
            <Input id="library-description" maxLength={180} />
          </div>
          <div>
            <label htmlFor="library-rotation">{"Rotation"}</label>
            <Select id="library-rotation">
              <option value="0">{"Original"}</option>
              <option value="90">{"90° clockwise"}</option>
              <option value="180">{"180°"}</option>
              <option value="270">{"90° anticlockwise"}</option>
            </Select>
          </div>
          <div>
            <label htmlFor="library-capture-date">
              {"Capture date · optional"}
            </label>
            <Input id="library-capture-date" type="date" />
          </div>
          <div>
            <label htmlFor="library-crop-x">
              {"Crop position · horizontal"}
            </label>
            <Input id="library-crop-x" type="range" min="0" max="100" />
          </div>
          <div>
            <label htmlFor="library-crop-y">{"Crop position · vertical"}</label>
            <Input id="library-crop-y" type="range" min="0" max="100" />
          </div>
          <div>
            <label className="cal-check">
              <Checkbox id="library-auto-crop" />
              {" Use suggested face position"}
            </label>
          </div>
          <div>
            <label htmlFor="library-seconds">
              {"Custom viewing time · seconds"}
            </label>
            <Input id="library-seconds" type="number" min="0" max="3600" />
            <p className="tiny">{"0 follows the slideshow."}</p>
          </div>
        </div>
        <Button id="library-save-picture" variant="secondary" type="button">
          {"Save picture details"}
        </Button>
      </div>
      <p className="small subtle">
        {
          "Suggestions use Android’s local face detector; they do not identify people or send pictures anywhere. Manual crop positions override suggestions. Capture dates are never invented from received dates."
        }
      </p>
    </>
  ),
  LibraryArrivals: () => (
    <>
      <label className="cal-check">
        <Switch id="library-review-new" />
        {" Review new emailed pictures before display"}
      </label>
      <label className="cal-check">
        <Switch id="library-capture-new" />
        {" Keep only the capture date from new imports"}
      </label>
      <p className="small subtle">
        {
          "Date retention is opt-in. Raw EXIF, GPS, filenames and mail contents are still discarded. Existing cached photos cannot recover their discarded dates."
        }
      </p>
      <div id="library-pending" className="library-collection-grid"></div>
      <div className="library-actions">
        <Button id="library-approve" variant="secondary" type="button">
          {"Approve selected"}
        </Button>
        <Button id="library-reject" variant="ghost" type="button">
          {"Reject selected"}
        </Button>
      </div>
      <p id="library-storage-note" className="small"></p>
      <meter
        id="library-storage-meter"
        className="library-meter"
        min="0"
        max="268435456"
        value="0"
      ></meter>
      <p className="small subtle">
        {
          "Recent photos: up to 200. Keepers: up to 100. All photos and muted clips share a 256 MiB budget. New imports can replace older unpinned pictures; Keepers never silently evicts a saved picture."
        }
      </p>
    </>
  ),
  LibraryImport: () => (
    <>
      <div className="library-actions">
        <Button id="library-import-images" variant="secondary" type="button">
          {"Import pictures to Keepers"}
        </Button>
        <Button id="library-import-video" variant="ghost" type="button">
          {"Import a muted clip"}
        </Button>
      </div>
      <p className="small subtle">
        {
          "Use Android’s file picker. Photos are copied and re-encoded privately. Video: H.264 MP4 or converted animated GIF, up to 30 seconds and 32 MiB, maximum 20 clips. Video audio and container metadata are removed."
        }
      </p>
      <Disclosure className="library-advanced">
        <DisclosureTitle>{"Optional soundtrack"}</DisclosureTitle>
        <div className="library-actions">
          <Button id="library-import-music" variant="ghost" type="button">
            {"Choose AAC / M4A soundtrack"}
          </Button>
          <Button id="library-erase-music" variant="ghost" type="button">
            {"Remove soundtrack"}
          </Button>
        </div>
        <label className="cal-check">
          <Switch id="library-music-enabled" />
          {" Play soundtrack with slideshow"}
        </label>
        <label htmlFor="library-music-volume">{"Soundtrack volume"}</label>
        <Input
          id="library-music-volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
        />
        <p id="library-music-status" className="small"></p>
      </Disclosure>
    </>
  ),
  SlideshowSchedule: () => (
    <>
      <label className="cal-check">
        <Switch id="slideshow-scheduled" />
        {" Automatic photos only during these hours"}
      </label>
      <div className="library-fields">
        <div>
          <label htmlFor="slideshow-start">{"From"}</label>
          <Input id="slideshow-start" type="time" />
        </div>
        <div>
          <label htmlFor="slideshow-end">{"Until"}</label>
          <Input id="slideshow-end" type="time" />
        </div>
      </div>
      <label className="cal-check">
        <Switch id="slideshow-dim" />
        {" Set app brightness by schedule"}
      </label>
      <div className="library-fields">
        <div>
          <label htmlFor="slideshow-brightness">
            {"During scheduled hours"}
          </label>
          <Input
            id="slideshow-brightness"
            type="range"
            min="0.05"
            max="1"
            step="0.05"
          />
        </div>
        <div>
          <label htmlFor="slideshow-night-brightness">
            {"Outside scheduled hours"}
          </label>
          <Input
            id="slideshow-night-brightness"
            type="range"
            min="0.05"
            max="1"
            step="0.05"
          />
        </div>
      </div>
      <p className="small subtle">
        {
          "Uses your chosen city’s time. Manual browsing remains available. Brightness changes only Skylit’s window, and restores the system’s normal setting when disabled. Existing quiet hours remain independent."
        }
      </p>
    </>
  ),
  SlideshowPresets: () => (
    <>
      <div className="library-fields">
        <div>
          <label htmlFor="slideshow-preset-name">
            {"Save current slideshow as"}
          </label>
          <Input id="slideshow-preset-name" maxLength={60} />
        </div>
        <div>
          <label htmlFor="slideshow-preset">{"Saved presets"}</label>
          <Select id="slideshow-preset"></Select>
        </div>
      </div>
      <div className="library-actions">
        <Button id="slideshow-save-preset" variant="secondary" type="button">
          {"Save preset"}
        </Button>
        <Button id="slideshow-load-preset" variant="ghost" type="button">
          {"Load preset"}
        </Button>
        <Button id="slideshow-delete-preset" variant="ghost" type="button">
          {"Delete preset"}
        </Button>
      </div>
      <label className="cal-check">
        <Switch id="slideshow-seasonal" />
        {" This preset is seasonal"}
      </label>
      <div className="library-fields">
        <div>
          <label htmlFor="slideshow-season-start">{"From month"}</label>
          <Input id="slideshow-season-start" type="number" min="1" max="12" />
        </div>
        <div>
          <label htmlFor="slideshow-season-end">{"Through month"}</label>
          <Input id="slideshow-season-end" type="number" min="1" max="12" />
        </div>
      </div>
      <p className="small subtle">
        {
          "On this day uses capture dates from earlier years. Seasonal presets can span December into January. An empty or out-of-season collection does not expose another collection automatically."
        }
      </p>
      <Disclosure className="library-advanced">
        <DisclosureTitle>{"Presentation title & video export"}</DisclosureTitle>
        <label className="cal-check">
          <Switch id="slideshow-story" />
          {" Show presentation title cards"}
        </label>
        <label htmlFor="slideshow-story-title">{"Title"}</label>
        <Input id="slideshow-story-title" maxLength={100} />
        <label htmlFor="slideshow-story-outro">
          {"Closing title · optional"}
        </label>
        <Input id="slideshow-story-outro" maxLength={100} />
        <label htmlFor="slideshow-title-seconds">
          {"Seconds per title card"}
        </label>
        <Input id="slideshow-title-seconds" type="number" min="2" max="10" />
        <p className="small subtle">
          {
            "Only deliberately titled presentations show this text. Everyday slideshows remain free of captions and titles."
          }
        </p>
        <label htmlFor="slideshow-export-seconds">
          {"Seconds per exported slide"}
        </label>
        <Input
          id="slideshow-export-seconds"
          type="number"
          min="2"
          max="10"
          defaultValue="5"
        />
        <div className="library-actions">
          <Button id="slideshow-export" variant="secondary" type="button">
            {"Export selected pictures as video"}
          </Button>
          <Button
            id="slideshow-export-cancel"
            variant="ghost"
            type="button"
            hidden={true}
          >
            {"Cancel export"}
          </Button>
        </div>
        <Status
          id="slideshow-export-status"
          className="small"
          role="status"
        ></Status>
        <video
          id="slideshow-export-preview"
          className="library-media-preview"
          controls={true}
          hidden={true}
        ></video>
        <p className="small subtle">
          {
            "A bounded WebM presentation: up to 12 selected still pictures and 120 seconds, saved to Downloads on the frame. Nothing is uploaded. Export support is checked on this browser."
          }
        </p>
      </Disclosure>
    </>
  ),
  PhoneSessionControls: () => (
    <>
      <div className="library-actions">
        <Button id="slideshow-phone-start" variant="secondary" type="button">
          Retry connection
        </Button>
        <Button id="slideshow-phone-stop" variant="ghost" type="button">
          Disconnect
        </Button>
      </div>
      <div
        id="slideshow-phone-status"
        className="library-phone-status"
        role="status"
      ></div>
    </>
  ),
  CloseSettingsIcon: () => (
    <>
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M6 6l12 12M18 6L6 18"></path>
      </svg>
    </>
  ),
  AddCalendarDisclosure: () => (
    <>
      <DisclosureTitle>{"Connect another calendar"}</DisclosureTitle>
    </>
  ),
  InviterSetupDisclosure: () => (
    <>
      <DisclosureTitle>{"Inviter review setup"}</DisclosureTitle>
    </>
  ),
  DisplayPreferences: () => (
    <>
      <label htmlFor="display-text">{"Text size"}</label>
      <Select id="display-text">
        <option value="standard">{"Standard"}</option>
        <option value="large">{"Larger text"}</option>
      </Select>
      <label htmlFor="overview-preset">{"Overview layout"}</label>
      <Select id="overview-preset">
        <option value="balanced">{"Balanced"}</option>
        <option value="photos">{"Photos first"}</option>
        <option value="agenda">{"Agenda first"}</option>
      </Select>
      <p className="small subtle">
        {
          "Layouts adapt to landscape screens. Colour mode follows the sun independently of quiet hours."
        }
      </p>
      <div className="appearance-preview" aria-label="Live appearance preview">
        <strong>{"9:15"}</strong>
        <span>{"Today on your frame"}</span>
        <span className="preview-accent">{"Selected palette"}</span>
      </div>
    </>
  ),
  PhotoPlaybackPreferences: () => (
    <>
      <label className="cal-check">
        <Switch id="photo-shuffle" />
        {" Shuffle slideshow"}
      </label>
      <label className="cal-check">
        <Switch id="photo-repeat" />
        {" Repeat slideshow"}
      </label>
      <label className="cal-check">
        <Switch id="photo-favourites-only" />
        {" Play favourites only"}
      </label>
      <label className="cal-check">
        <Switch id="photo-prefer-favourites" />
        {" Prefer favourites on Overview"}
      </label>
      <div
        className="style-previews"
        role="group"
        aria-label="Slideshow styles"
      >
        <NativeButton data-style="fade" className="style-preview">
          <span className="sample-fade" aria-hidden="true"></span>
          {"Soft fade"}
        </NativeButton>
        <NativeButton data-style="stack" className="style-preview">
          <span className="sample-stack" aria-hidden="true"></span>
          {"Falling prints"}
        </NativeButton>
        <NativeButton data-style="collage" className="style-preview">
          <span className="sample-collage" aria-hidden="true"></span>
          {"Photo collage"}
        </NativeButton>
      </div>
    </>
  ),
  MailAccountDisclosure: () => (
    <>
      <DisclosureTitle>{"Connect or change Gmail account"}</DisclosureTitle>
      <p className="small subtle">
        {
          "Use a dedicated Gmail inbox. Enable Google 2-Step Verification, then create an app password on your computer. Enter it only here."
        }
      </p>
    </>
  ),
  MailDeliveryPolicy: () => (
    <>
      <h3>{"Delivery"}</h3>
      <p className="small subtle">
        {
          "Saving an app password configures delivery. Send a test picture, then check the library, slideshow advance and offline playback on the frame."
        }
      </p>
      <form id="photo-delivery-policy">
        <label htmlFor="photo-refresh-interval">{"Automatic mail check"}</label>
        <Select id="photo-refresh-interval">
          <option value="900">{"Every 15 minutes"}</option>
          <option value="3600">{"Every hour"}</option>
          <option value="86400">{"Once a day"}</option>
        </Select>
        <Disclosure>
          <DisclosureTitle>{"Trusted senders · optional"}</DisclosureTitle>
          <label className="cal-check">
            <Switch id="photo-trusted" />
            {" Only import from these senders"}
          </label>
          <label htmlFor="photo-senders">
            {"Exact email addresses · one per line"}
          </label>
          <Textarea
            id="photo-senders"
            rows={3}
            maxLength={12800}
            autoComplete="off"
            spellCheck={false}
          ></Textarea>
          <p className="small subtle">
            {
              "Checked before new attachments are saved. Sender addresses can be forged; this is a display rule, not proof of identity. Changing the rule keeps existing pictures. Erase the cache below if they should be removed."
            }
          </p>
        </Disclosure>
        <Button variant="secondary" type="submit">
          {"Save delivery options"}
        </Button>
        <Status
          id="photo-delivery-status"
          role="status"
          className="small"
        ></Status>
      </form>
    </>
  ),
  QuietHours: () => (
    <>
      <label className="cal-check">
        <Switch id="quiet-enabled" />
        {" Quiet ambient display during these hours"}
      </label>
      <div className="field-pair">
        <div>
          <label htmlFor="quiet-start">{"From"}</label>
          <Input id="quiet-start" type="time" />
        </div>
        <div>
          <label htmlFor="quiet-end">{"Until"}</label>
          <Input id="quiet-end" type="time" />
        </div>
      </div>
      <p className="small subtle">
        {
          "Uses your chosen city’s time. After the idle delay, a quiet clock replaces photos and events. Active video and manual photo browsing are left uninterrupted. If automatic photos are off, quiet display uses two minutes of inactivity. Touch to return. This does not change screen brightness."
        }
      </p>
      <Button type="submit" id="privacy-pause" variant="secondary">
        {"Pause private content now"}
      </Button>
    </>
  ),
  PrivacyPause: () => (
    <>
      <div>
        <p className="eyebrow" id="ambient-label">
          {"PRIVACY PAUSE"}
        </p>
        <strong id="ambient-clock"></strong>
        <p id="ambient-date"></p>
        <Button type="submit" id="privacy-restore" variant="secondary">
          {"Return to dashboard"}
        </Button>
      </div>
    </>
  ),
  NavigationPreferences: () => (
    <>
      <label className="cal-check">
        <Switch id="show-home" />
        {" Show Home in navigation"}
      </label>
      <label className="cal-check">
        <Switch id="show-youtube" />
        {" Show YouTube in navigation"}
      </label>
      <p className="small subtle">
        {
          "Overview, Weather, Photos, Calendar and Settings always stay available."
        }
      </p>
    </>
  ),
  HomeChecklist: () => (
    <>
      <DisclosureTitle>{"First-use checklist"}</DisclosureTitle>
      <ol>
        <li>{"Open Google Home and sign in on the frame."}</li>
        <li>{"Confirm your household appears."}</li>
        <li>{"Try an actual device operation and use Return to Skylit."}</li>
      </ol>
    </>
  ),
  YouTubeShortcutsForm: () => (
    <>
      <p className="small subtle">
        {
          "Up to six owner-entered public videos or playlists. They open the external website; playback still depends on the frame browser."
        }
      </p>
      <div id="youtube-shortcut-edit"></div>
      <form id="youtube-shortcut-form">
        <label htmlFor="youtube-shortcut-title">{"Title"}</label>
        <Input id="youtube-shortcut-title" maxLength={60} required={true} />
        <label htmlFor="youtube-shortcut-url">{"Video or playlist link"}</label>
        <Input
          id="youtube-shortcut-url"
          type="url"
          required={true}
          autoComplete="off"
          placeholder="https://www.youtube.com/…"
        />
        <Button type="submit" variant="secondary">
          {"Add shortcut"}
        </Button>
        <Status
          id="youtube-shortcut-status"
          role="status"
          className="small"
        ></Status>
      </form>
    </>
  ),
  HouseholdPage: () => (
    <>
      <div className="page-heading">
        <h1>{"Household"}</h1>
        <Button type="submit" id="household-options" variant="secondary">
          {"Household options"}
        </Button>
      </div>
      <p className="household-scope subtle small">
        {"On this frame · Works offline"}
      </p>
      <div className="household-grid">
        <article className="card household-note">
          <div className="section-title">
            <h2>{"Note"}</h2>
            <Button type="submit" id="note-edit" variant="ghost">
              {"Edit"}
            </Button>
          </div>
          <p id="household-note"></p>
        </article>
        <article className="card shopping-card">
          <div className="section-title">
            <h2>{"Shopping"}</h2>
            <Button
              type="submit"
              id="shopping-undo"
              variant="ghost"
              hidden={true}
            >
              {"Undo"}
            </Button>
          </div>
          <form id="shopping-add" className="input-row">
            <label htmlFor="shopping-input" className="sr-only">
              {"Add shopping item"}
            </label>
            <Input
              id="shopping-input"
              placeholder="Add an item"
              maxLength={100}
              required={true}
            />
            <Button type="submit" variant="secondary">
              {"Add"}
            </Button>
          </form>
          <div id="shopping-items"></div>
          <Disclosure>
            <DisclosureTitle id="shopping-completed-label">
              {"Completed"}
            </DisclosureTitle>
            <div id="shopping-completed"></div>
            <Button type="submit" id="shopping-clear" variant="ghost">
              {"Clear completed"}
            </Button>
          </Disclosure>
        </article>
        <article
          id="household-dates-card"
          className="card household-dates"
          hidden={true}
        >
          <h2>{"Coming up"}</h2>
          <div id="household-countdowns"></div>
        </article>
        <article className="card household-timers">
          <div className="section-title">
            <h2>{"Timers"}</h2>
            <span className="small subtle">{"On this frame"}</span>
          </div>
          <form id="timer-add" className="input-row">
            <label className="sr-only" htmlFor="timer-minutes">
              {"Minutes"}
            </label>
            <Input
              id="timer-minutes"
              type="number"
              min="1"
              max="1440"
              defaultValue="10"
              aria-label="Timer minutes"
            />
            <Button type="submit" variant="secondary">
              {"Start timer"}
            </Button>
          </form>
          <div id="household-timers"></div>
          <p className="tiny">
            {
              "Visible reminders while Skylit is open. No sound or phone notifications."
            }
          </p>
        </article>
      </div>
    </>
  ),
  HouseholdPreferences: () => (
    <>
      <label className="cal-check">
        <Switch id="show-household" />
        {" Show Household in navigation"}
      </label>
      <Button type="submit" id="household-open" variant="secondary">
        {"Open Household"}
      </Button>
      <label htmlFor="household-note-input">
        {"Pinned note · on this frame"}
      </label>
      <Textarea id="household-note-input" rows={4} maxLength={600}></Textarea>
      <Button type="submit" id="household-note-save" variant="secondary">
        {"Save note"}
      </Button>
      <label className="cal-check">
        <Checkbox id="household-excerpt" />
        {" Show a short note on Overview"}
      </label>
      <p className="small subtle">
        {
          "Notes and lists stay on this frame. They do not sync to a phone or Google Keep."
        }
      </p>
    </>
  ),
  CountdownForm: () => (
    <>
      <p className="small subtle">
        {
          "Up to five dates, entered locally. Calendar event details also offer Add countdown."
        }
      </p>
      <div id="countdown-edit"></div>
      <form id="countdown-form">
        <label htmlFor="countdown-title">{"Title"}</label>
        <Input id="countdown-title" maxLength={60} required={true} />
        <label htmlFor="countdown-date">{"Date"}</label>
        <Input id="countdown-date" type="date" required={true} />
        <Button type="submit" variant="secondary">
          {"Add countdown"}
        </Button>
        <Status id="countdown-status" role="status" className="small"></Status>
      </form>
    </>
  ),
  ServiceHealthFrame: () => (
    <>
      <p className="small subtle">
        {
          "Network availability does not verify an account or service. Saved data remains usable when a refresh fails."
        }
      </p>
      <div id="service-health"></div>
    </>
  ),
  AndroidSettingsShortcuts: () => (
    <>
      <p className="small subtle">
        {
          "After a restart, reconnect Wi-Fi if needed, then turn on Wireless debugging in Developer options."
        }
      </p>
      <div className="android-controls"></div>
      <p className="small subtle">
        {
          "Open Android Settings or another installed app. Home returns to Skylit when it is your home screen. Back returns from Android Settings."
        }
      </p>
    </>
  ),
  DisplayTransferForm: () => (
    <>
      <p className="small subtle">
        {
          "Palette, mode, clock, units, text size and optional Home/YouTube navigation. Custom dashboard layouts stay on this frame. Accounts, links, pictures, city, notes and inviter identities are excluded."
        }
      </p>
      <Button type="submit" id="preferences-export" variant="secondary">
        {"Export display preferences"}
      </Button>
      <label htmlFor="preferences-import">
        {"Import a display-preferences file"}
      </label>
      <Input
        id="preferences-import"
        type="file"
        accept="application/json,.json"
      />
      <Disclosure>
        <DisclosureTitle>{"Copy or paste on the frame"}</DisclosureTitle>
        <label htmlFor="preferences-transfer">
          {"Display preferences JSON"}
        </label>
        <Textarea
          id="preferences-transfer"
          rows={5}
          maxLength={4096}
          spellCheck={false}
        ></Textarea>
        <Button type="submit" id="preferences-apply" variant="secondary">
          {"Import pasted preferences"}
        </Button>
      </Disclosure>
      <Status
        id="preferences-transfer-status"
        role="status"
        className="small"
      ></Status>
    </>
  ),
  ModuleActionIcon: () => (
    <>
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M4 12h16m-6-6 6 6-6 6"></path>
      </svg>
    </>
  ),
  DashboardEditorFrame: () => (
    <>
      <article className="card setting-block dashboard-editor">
        <h3>{"Dashboard"}</h3>
        <p className="small subtle">
          {
            "Drag modules to place them; drag a corner to resize. Changes save automatically."
          }
        </p>
        <div className="dashboard-editor-toolbar">
          <div id="dashboard-starting-layout"></div>
        </div>
        <div
          id="dashboard-editor-grid"
          className="dashboard-editor-grid"
          role="group"
          aria-label="Dashboard layout preview"
        ></div>
        <Status
          id="dashboard-editor-status"
          className="small"
          role="status"
        ></Status>
        <div id="dashboard-selection" className="dashboard-selection">
          <h4 id="dashboard-selection-title"></h4>
          <p className="tiny subtle">
            {"Arrow keys on a module move it. Shift + arrows resize it."}
          </p>
          <div id="dashboard-clock-options">
            <label htmlFor="dashboard-clock-style">{"Clock style"}</label>
            <Select id="dashboard-clock-style"></Select>
            <div
              id="dashboard-clock-preview"
              className="clock-sample"
              role="img"
              aria-label="Clock style preview"
            ></div>
          </div>
          <Button type="submit" id="dashboard-remove" variant="ghost">
            {"Remove module"}
          </Button>
        </div>
      </article>
      <article className="card setting-block">
        <h3>{"Module gallery"}</h3>
        <p className="small subtle">
          {
            "Tap to add, or drag onto the canvas. One of each module. Move or resize existing widgets to make room."
          }
        </p>
        <div id="dashboard-gallery" className="dashboard-gallery"></div>
      </article>
    </>
  ),
};
export function template(name: string) {
  if (!templates[name]) throw Error("Unknown UI template: " + name);
  return templates[name]();
}
export function ArticleBody({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <h3>{title}</h3>
      {children}
    </>
  );
}
export function LibrarySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <DisclosureTitle>{title}</DisclosureTitle>
      <div>{children}</div>
    </>
  );
}
