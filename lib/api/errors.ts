import { ApiError } from "@/lib/api/types";

export function formatApiErrorForUi(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "not_found") {
      return "No lobby found with that code. Check and try again.";
    }
    if (err.code === "conflict") {
      const raw = err.message || "";
      const msg = raw.toLowerCase();
      if (msg.includes("already in a lobby")) {
        return "You're already in a lobby. Leave it before starting another.";
      }
      if (msg.includes("lobby is full") || msg.includes("full")) {
        return "That lobby is full or not accepting players right now.";
      }
      return raw || "That lobby is full or not accepting players right now.";
    }
    if (err.code === "bad_request") {
      return err.message || "The request was invalid. Try again.";
    }
    if (err.code === "network") {
      return "Cannot reach the server. Check the API address and your network.";
    }
    return err.message || "Something went wrong.";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
