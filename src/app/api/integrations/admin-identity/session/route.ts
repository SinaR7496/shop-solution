import "server-only";
import { identityUserResponseSchema } from "@/features/search-recommendations/schemas/identity-session";

const noStoreHeaders = { "Cache-Control": "no-store" };

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: noStoreHeaders });
}

function errorResponse(code: string, message: string, status: number) {
  return jsonResponse({ error: { code, message } }, status);
}

function getIdentityCookie(cookieHeader: string | null) {
  const pair = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("erp_access_token="));
  const value = pair?.slice("erp_access_token=".length);
  return value ? `erp_access_token=${value}` : undefined;
}

export async function GET(request: Request) {
  const identityCookie = getIdentityCookie(request.headers.get("cookie"));
  if (!identityCookie) return jsonResponse({ authenticated: false });

  const identityApiBaseUrl =
    process.env.ADMIN_IDENTITY_API_URL ?? "http://localhost:8000";
  const identitySessionUrl = new URL("/auth/session", identityApiBaseUrl);

  let upstream: Response;
  try {
    upstream = await fetch(identitySessionUrl, {
      headers: { Cookie: identityCookie },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return errorResponse(
      "IDENTITY_SESSION_UNAVAILABLE",
      "Could not check the Admin & Identity session. Search remains available; try again.",
      503,
    );
  }

  if (upstream.status === 401) return jsonResponse({ authenticated: false });
  if (!upstream.ok) {
    return errorResponse(
      "IDENTITY_SESSION_UNAVAILABLE",
      "Could not check the Admin & Identity session. Search remains available; try again.",
      503,
    );
  }

  let body: unknown;
  try {
    body = await upstream.json();
  } catch {
    return errorResponse(
      "IDENTITY_SESSION_INVALID_RESPONSE",
      "The Admin & Identity service returned an invalid session response.",
      502,
    );
  }

  const session = identityUserResponseSchema.safeParse(body);
  if (!session.success || !session.data.is_active) {
    return errorResponse(
      "IDENTITY_SESSION_INVALID_RESPONSE",
      "The Admin & Identity service returned an invalid session response.",
      502,
    );
  }

  return jsonResponse({
    authenticated: true,
    email: session.data.email,
    displayName: session.data.display_name,
  });
}
