import { NextRequest, NextResponse } from "next/server";

import { getOutlookCredentials } from "@/lib/auth";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { MICROSOFT_GRAPH_AUTH_ENDPOINTS } from "@/lib/outlook";

const LOG_SOURCE = "OutlookMailOAuthStart";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;
  const { clientId } = await getOutlookCredentials();
  const redirectUrl = `${process.env.NEXTAUTH_URL}/api/mail/oauth/outlook/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUrl,
    response_mode: "query",
    prompt: "consent",
    scope: [
      "openid",
      "profile",
      "email",
      "offline_access",
      "User.Read",
      "Mail.Read",
      "Mail.ReadWrite",
    ].join(" "),
  });
  return NextResponse.redirect(
    `${MICROSOFT_GRAPH_AUTH_ENDPOINTS.auth}?${params}`
  );
}
