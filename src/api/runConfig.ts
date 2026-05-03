// API wrapper for GET /functions/v1/run-config — Task 8.1
import type { RunConfig } from "../types";

export async function fetchRunConfig(): Promise<RunConfig> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-config`;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    throw new Error(`Network error fetching run config: ${err}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch run config: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<RunConfig>;
}
