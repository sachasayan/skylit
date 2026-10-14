export type ShoppingItem = { id: string; text: string; done: boolean };
export type Countdown = { title: string; date: string };
export type TimerItem = { id: string; title: string; end: number };
export type Household = {
  note: string;
  shopping: ShoppingItem[];
  countdowns: Countdown[];
  timers: TimerItem[];
};
export type CalendarEvent = {
  source: string;
  key: string;
  title: string;
  name: string;
  color: string;
  startDay: string;
  location?: string;
  description?: string;
};
export type EventRow = { event: CalendarEvent; time: string; range?: string };
export type EventGroup = { key: string; title: string; items: EventRow[] };
export type ModuleType =
  | "clock"
  | "photos"
  | "weather"
  | "plans"
  | "forecast"
  | "shopping"
  | "note"
  | "countdowns"
  | "timers";
export type DashboardModule = {
  type: ModuleType;
  x: number;
  y: number;
  w: number;
  h: number;
};
export type ModuleDefinition = {
  type: ModuleType;
  name: string;
  description: string;
};
