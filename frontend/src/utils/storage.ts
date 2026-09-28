const TOKEN_KEY = 'dogfood_auth_token';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
};

export const removeStoredToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
};
