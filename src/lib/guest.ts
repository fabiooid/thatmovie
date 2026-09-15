export const GUEST_STORAGE_KEY = 'thatmovie-guest-id';
export const CHAT_RESOURCE_ID = 'thatmovie-web';

const GUEST_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isGuestId = (value: unknown): value is string =>
  typeof value === 'string' && GUEST_ID_RE.test(value);

export const createGuestId = () => crypto.randomUUID();

export const getGuestId = () => {
  const existing = localStorage.getItem(GUEST_STORAGE_KEY);

  if (isGuestId(existing)) {
    return existing;
  }

  const id = createGuestId();
  localStorage.setItem(GUEST_STORAGE_KEY, id);
  return id;
};

export const saveGuestId = (id: string) => {
  localStorage.setItem(GUEST_STORAGE_KEY, id);
};
