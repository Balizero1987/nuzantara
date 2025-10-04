export type ChatRequest = {
  input: string;
  system?: string;
  model?: string;
};

export type CalendarCreateRequest = {
  summary: string;
  description?: string;
  start: string;     // ISO 8601 dateTime
  end: string;       // ISO 8601 dateTime
  timeZone?: string; // e.g. "Asia/Jakarta"
  attendees?: { email: string }[];
  createMeet?: boolean;
  sendUpdates?: "all" | "externalOnly" | "none";
};