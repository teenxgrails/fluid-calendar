import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { newDate } from "@/lib/date-utils";
import { logger } from "@/lib/logger";
import { createRedisSubscriber } from "@/lib/queue/connection";
import { getUserRealtimeChannel } from "@/lib/realtime/channels";

const LOG_SOURCE = "RealtimeStreamAPI";
const HEARTBEAT_INTERVAL_MS = 20_000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  if (!process.env.REDIS_URL) {
    return NextResponse.json(
      { error: "Realtime service is not configured" },
      { status: 503 }
    );
  }

  const encoder = new TextEncoder();
  const channel = getUserRealtimeChannel(auth.userId);
  const subscriber = createRedisSubscriber();
  let cleanupStream: (() => Promise<void>) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (value: string) => {
        if (!closed) controller.enqueue(encoder.encode(value));
      };
      const heartbeat = setInterval(
        () => send(`: heartbeat ${newDate().getTime()}\n\n`),
        HEARTBEAT_INTERVAL_MS
      );
      const cleanup = async () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        subscriber.removeAllListeners("message");
        try {
          await subscriber.unsubscribe(channel);
          await subscriber.quit();
        } catch (error) {
          await logger.warn(
            "Failed to close realtime subscriber cleanly",
            {
              userId: auth.userId,
              error: error instanceof Error ? error.message : String(error),
            },
            LOG_SOURCE
          );
        }
        try {
          controller.close();
        } catch {
          // The browser may already have closed the stream.
        }
      };
      cleanupStream = cleanup;

      request.signal.addEventListener("abort", () => {
        void cleanup();
      });

      try {
        await subscriber.connect();
        await subscriber.subscribe(channel);
        subscriber.on("message", (_redisChannel, payload) => {
          try {
            const parsed = JSON.parse(payload) as { type?: string };
            const eventName = parsed.type ?? "message";
            send(`event: ${eventName}\ndata: ${payload}\n\n`);
          } catch {
            send(`data: ${payload}\n\n`);
          }
        });
        send("event: ready\ndata: {}\n\n");
      } catch (error) {
        await logger.error(
          "Failed to start realtime stream",
          {
            userId: auth.userId,
            error: error instanceof Error ? error.message : String(error),
          },
          LOG_SOURCE
        );
        await cleanup();
      }
    },
    async cancel() {
      await cleanupStream?.();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
