export type ApiError = { code: string; message: string };
export type ApiResponse<T> = { data: T | null; error: ApiError | null };
export type EventFormat = "IN_PERSON" | "ONLINE" | "HYBRID";

export type EventItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  format: EventFormat;
  startsAt: string;
  endsAt: string;
  registrationDeadline: string | null;
  capacity: number;
  remainingSlots: number;
  createdAt: string;
};

export type OrganizerEventItem = EventItem & { isHidden: boolean };

export type Registration = {
  id: string;
  eventId: string;
  createdAt: string;
  checkedInAt: string | null;
};

export type EventDetail = EventItem & { registration: Registration | null };
export type ScheduledRegistration = Registration & { event: EventItem };

export type NoteItem = {
  id: string;
  userId: string;
  eventId: string;
  content: string;
  summary: string | null;
  updatedAt: string;
};
