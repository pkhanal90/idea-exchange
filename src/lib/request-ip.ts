import { headers } from "next/headers";

// Vercel sets x-forwarded-for with the real client IP first in the list.
// Shared by audit logging and rate limiting so both derive it identically.
export async function getClientIp(): Promise<string | undefined> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
}
