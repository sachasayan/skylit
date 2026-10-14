/** The native methods used by React. JavaScript-only adapters keep their own APIs. */
export interface NativeBridge {
  photoStatus(): string;
  calendarList(): string;
  updateStatus(): string;
  updateConfigure(settings: string): boolean;
  updateHeartbeat(ready: boolean): void;
  updatePermission(): void;
  updateBackgroundCheck(): void;
  updateCheck(): void;
  updateDownload(): void;
  updateInstall(): void;
}
export interface AppService {
  refreshWeather(): void;
  go(tab: string): void;
  openSettings(area: string, from?: string): void;
  settingsOpen(): boolean;
  notify(message: string): void;
  setupState(): { city: boolean; album: boolean };
  status(): { tab: string };
  calendarPreferences(): { timezone: string; clock: string };
}
export type UpdateSettings = {
  check: boolean;
  download: boolean;
  install: boolean;
  start: number;
  end: number;
  timezone: string;
};
export type UpdateState = {
  supported: boolean;
  installed: string;
  installedCode: number;
  stage: string;
  version: string;
  notes: string;
  message: string;
  permission: boolean;
  lastChecked: number;
  settings: UpdateSettings;
};
export interface UpdateModel {
  normalize(value?: unknown): UpdateState;
  policy(settings: UpdateSettings): string;
  policySettings(value: string, current: UpdateSettings): UpdateSettings | null;
  action(state: UpdateState): ["check" | "download" | "install", string] | null;
  badge(state: UpdateState): boolean;
}
