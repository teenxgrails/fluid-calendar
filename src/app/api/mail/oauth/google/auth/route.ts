import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { createGoogleOAuthClient } from "@/lib/google";

const LOG_SOURCE = "GoogleMailOAuthStart";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;
  const redirectUrl = `${process.env.NEXTAUTH_URL}/api/mail/oauth/google/callback`;
  const oauth2Client = await createGoogleOAuthClient({ redirectUrl });
  return NextResponse.redirect(
    oauth2Client.generateAuthUrl({
      access_type: "offline",
      include_granted_scopes: true,
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
      ],
    })
  );
}
