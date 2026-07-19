import { prisma } from "@/lib/prisma";

import { VISUAL_TEST_EMAIL, VISUAL_TEST_TASK_IDS } from "./fixtures";

export default async function globalTeardown() {
  await prisma.task.deleteMany({
    where: { id: { in: [...VISUAL_TEST_TASK_IDS] } },
  });
  await prisma.user.deleteMany({
    where: { email: VISUAL_TEST_EMAIL },
  });
  await prisma.$disconnect();
}
