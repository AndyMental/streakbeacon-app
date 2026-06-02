import { NextResponse, type NextRequest } from "next/server";

import { createEmptyStreakData } from "@/lib/streaks/model";
import { parseStreakData } from "@/lib/streaks/storage";

const unauthorizedResponse = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const invalidDataResponse = () =>
  NextResponse.json({ error: "Invalid data provided" }, { status: 400 });

function hasBearerAuth(request: Request): boolean {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return false;
  }

  const [scheme, token] = authorization.trim().split(/\s+/, 2);

  return scheme?.toLowerCase() === "bearer" && Boolean(token?.trim());
}

export function GET(request: NextRequest) {
  if (!hasBearerAuth(request)) {
    return unauthorizedResponse();
  }

  return NextResponse.json(createEmptyStreakData());
}

export async function POST(request: NextRequest) {
  if (!hasBearerAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const data = parseStreakData(await request.json());

    return NextResponse.json(data);
  } catch {
    return invalidDataResponse();
  }
}
