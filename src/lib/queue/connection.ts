import IORedis from "ioredis";

import { logger } from "@/lib/logger";

const LOG_SOURCE = "QueueConnection";

let connection: IORedis | null = null;

function getRedisUrl(): string {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is required for queue and realtime services.");
  }
  return redisUrl;
}

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(getRedisUrl(), {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    connection.on("error", (error) => {
      void logger.error(
        "Redis connection error",
        { error: error.message },
        LOG_SOURCE
      );
    });
  }
  return connection;
}

export function createRedisSubscriber(): IORedis {
  const subscriber = new IORedis(getRedisUrl(), {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
  });
  subscriber.on("error", (error) => {
    void logger.error(
      "Redis subscriber error",
      { error: error.message },
      LOG_SOURCE
    );
  });
  return subscriber;
}

export async function closeRedisConnection(): Promise<void> {
  if (!connection) return;
  const currentConnection = connection;
  connection = null;
  await currentConnection.quit();
}
