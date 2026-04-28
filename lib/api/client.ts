import { getApiBaseUrl } from "@/lib/config";
import { ApiError, type ApiErrorCode } from "@/lib/api/types";

function statusToCode(status: number): ApiErrorCode {
  if (status === 400) return "bad_request";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  return "unknown";
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const { method = "GET", body, signal } = options;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers:
        body !== undefined
          ? { "Content-Type": "application/json", Accept: "application/json" }
          : { Accept: "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    throw new ApiError("Network error. Check your connection and API URL.", {
      code: "network",
      cause: e,
    });
  }

  const text = await res.text();
  let data: unknown = undefined;
  if (text.length > 0) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      if (!res.ok) {
        throw new ApiError(res.statusText || "Invalid response", {
          code: statusToCode(res.status),
          status: res.status,
          detail: text,
        });
      }
      throw new ApiError("Could not parse JSON response", {
        code: "invalid_response",
        status: res.status,
        detail: text,
      });
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : res.statusText || `Request failed (${res.status})`;
    throw new ApiError(msg, {
      code: statusToCode(res.status),
      status: res.status,
      detail: data,
    });
  }

  return data as T;
}
