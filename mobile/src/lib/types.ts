export type ApiError = { code: string; message: string };
export type ApiResponse<T> = { data: T | null; error: ApiError | null };

export type EventItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
};

export type Registration = {
  id: string;
  eventId: string;
  createdAt: string;
  checkedInAt: string | null;
};

export type EventDetail = EventItem & { registration: Registration | null };
export type ScheduledRegistration = Registration & { event: EventItem };
