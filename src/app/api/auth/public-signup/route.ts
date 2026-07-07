import { NextResponse } from "next/server";

/**
 * GET endpoint to check if public signup is enabled
 */
export async function GET() {
  return NextResponse.json({ enabled: false });
}
