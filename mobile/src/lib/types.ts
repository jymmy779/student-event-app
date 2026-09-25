export type ApiError = { code: string; message: string };
export type ApiResponse<T> = { data: T | null; error: ApiError | null };

export type RegistrationStatus = {
  isRegistered: boolean;
  checkedInAt: string | null;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  registration: RegistrationStatus;
};

export type Registration = {
  id: string;
  userId: string;
  eventId: string;
  createdAt: string;
  checkedInAt: string | null;
  event: Omit<EventItem, "registration">;
};
