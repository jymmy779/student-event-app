export const publicEventSelect = {
  id: true,
  title: true,
  description: true,
  location: true,
  startsAt: true,
  endsAt: true,
  createdAt: true,
} as const;

export const publicRegistrationSelect = {
  id: true,
  eventId: true,
  createdAt: true,
  checkedInAt: true,
} as const;
