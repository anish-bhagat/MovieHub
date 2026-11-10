/**
 * MovieHub Admin Portal - API Client Module
 */

export function getAdminToken() {
  return sessionStorage.getItem('moviehubAdminToken') || '';
}

export function setAdminToken(token) {
  sessionStorage.setItem('moviehubAdminToken', token.trim());
}

export function localDate(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Perform an authenticated request with X-Admin-Token header
 */
export async function request(path, options = {}) {
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    'X-Admin-Token': token,
    ...(options.headers || {}),
  };

  const response = await fetch(path, { ...options, headers });
  let data = {};
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

/**
 * Perform a public unauthenticated request
 */
export async function publicRequest(path) {
  const response = await fetch(path);
  let data = {};
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}
