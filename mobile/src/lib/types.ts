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
