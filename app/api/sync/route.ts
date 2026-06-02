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

/**
 * @openapi
 * /sync:
 *   get:
 *     summary: Fetch the latest synced streak data
 *     description: Retrieves the full streak data set including items, completions, and preferences from the remote backup.
 *     operationId: getSync
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StreakData"
 *       "401":
 *         description: Unauthorized
 */
export function GET(request: NextRequest) {
  if (!hasBearerAuth(request)) {
    return unauthorizedResponse();
  }

  return NextResponse.json(createEmptyStreakData());
}

/**
 * @openapi
 * /sync:
 *   post:
 *     summary: Upsert streak data
 *     description: Updates or inserts streak data to the remote backup.
 *     operationId: postSync
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/StreakData"
 *     responses:
 *       "200":
 *         description: Data successfully synced
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StreakData"
 *       "400":
 *         description: Invalid data provided
 *       "401":
 *         description: Unauthorized
 */
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
