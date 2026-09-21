import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_SERVER_URL;

export function getBackendUrl() {
  return BACKEND_URL;
}

/** Forward the logged-in user's access token to Nest so garage scoping works. */
export async function backendAuthHeaders(
  extra?: Record<string, string>,
): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const headers: Record<string, string> = {
    ...(extra || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function backendFetch(
  path: string,
  init?: RequestInit & { json?: unknown },
) {
  if (!BACKEND_URL) {
    throw new Error("BACKEND_SERVER_URL is not configured");
  }

  const headers = await backendAuthHeaders(
    init?.json !== undefined
      ? { "Content-Type": "application/json", ...(init.headers as Record<string, string>) }
      : (init?.headers as Record<string, string>),
  );

  const { json, ...rest } = init || {};
  return fetch(`${BACKEND_URL}${path}`, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: "no-store",
  });
}

export async function parseBackendResponse(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return {
      message: "Backend returned a non-JSON response",
      detail: text.slice(0, 300),
    };
  }
}
