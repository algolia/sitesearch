import { ASSISTANT_ID, BASE_ASKAI_URL } from './constants';

const TOKEN_STORAGE_KEY = `askai_chat_token_${ASSISTANT_ID}`;
let inMemoryToken: string | null = null;

export function getCachedToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (stored) {
      inMemoryToken = stored;
      return inMemoryToken;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export async function getOrCreateToken(): Promise<string> {
  const cached = getCachedToken();
  if (cached) return cached;

  const response = await fetch(`${BASE_ASKAI_URL}/chat/token`, {
    method: 'POST',
    headers: {
      'X-Algolia-Assistant-Id': ASSISTANT_ID,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to retrieve token (${response.status})`);
  }
  const data = await response.json();
  const token: string = data.token;
  inMemoryToken = token;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // ignore storage errors
  }
  return token;
}

export function clearToken(): void {
  inMemoryToken = null;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}


