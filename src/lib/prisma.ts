import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isNeonPooledUrl(url: string | undefined): boolean {
  return Boolean(url?.includes("neon.tech") && url.includes("-pooler."));
}

function createNeonAdapter(url: string) {
  try {
    // Optional runtime dependency: local development can run without these
    // packages installed, while Vercel/Neon uses them once dependencies are
    // installed from package.json.
    const optionalRequire = eval("require") as (moduleName: string) => unknown;
    const { Pool } = optionalRequire("@neondatabase/serverless") as {
      Pool: new (config: { connectionString: string }) => unknown;
    };
    const { PrismaNeon } = optionalRequire("@prisma/adapter-neon") as {
      PrismaNeon: new (pool: unknown) => unknown;
    };
    return new PrismaNeon(new Pool({ connectionString: url }));
  } catch {
    return null;
  }
}

// Properly handle connection lifecycle
function createPrismaClient() {
  const neonAdapter = isNeonPooledUrl(process.env.DATABASE_URL)
    ? createNeonAdapter(process.env.DATABASE_URL!)
    : null;
  const client = new PrismaClient({
    ...(neonAdapter
      ? {
          adapter: neonAdapter as Prisma.PrismaClientOptions["adapter"],
        }
      : {}),
    log: ["error"],
  });

  // Ensure connection is properly closed before process exits
  process.on("beforeExit", async () => {
    await client.$disconnect();
    console.log("[PrismaClient] Disconnected Prisma client before exit");
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
