import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "youtube-recipe-card-web",
    timestamp: new Date().toISOString(),
  });
}
