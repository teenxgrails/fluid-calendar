import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";

import {
  VISUAL_TEST_EMAIL,
  VISUAL_TEST_PASSWORD,
  VISUAL_TEST_TASK_IDS,
} from "./fixtures";

export default async function globalSetup() {
  const passwordHash = await hash(VISUAL_TEST_PASSWORD, 8);
  const user = await prisma.user.upsert({
    where: { email: VISUAL_TEST_EMAIL },
    update: {
      name: "Visual QA",
      role: "admin",
    },
    create: {
      email: VISUAL_TEST_EMAIL,
      name: "Visual QA",
      role: "admin",
    },
  });

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "credentials",
        providerAccountId: VISUAL_TEST_EMAIL,
      },
    },
    update: {
      userId: user.id,
      id_token: passwordHash,
    },
    create: {
      userId: user.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: VISUAL_TEST_EMAIL,
      id_token: passwordHash,
    },
  });

  await Promise.all([
    prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        theme: "dark",
        defaultView: "week",
        timeZone: "Europe/Zurich",
        weekStartDay: "monday",
        timeFormat: "12h",
      },
      create: {
        userId: user.id,
        theme: "dark",
        defaultView: "week",
        timeZone: "Europe/Zurich",
        weekStartDay: "monday",
        timeFormat: "12h",
      },
    }),
    prisma.calendarSettings.upsert({
      where: { userId: user.id },
      update: {
        workingHoursEnabled: true,
        workingHoursStart: "09:00",
        workingHoursEnd: "17:00",
        workingHoursDays: "[1,2,3,4,5]",
      },
      create: {
        userId: user.id,
        workingHoursEnabled: true,
        workingHoursStart: "09:00",
        workingHoursEnd: "17:00",
        workingHoursDays: "[1,2,3,4,5]",
      },
    }),
    prisma.userCustomization.upsert({
      where: { userId: user.id },
      update: {
        themePreset: "needt",
        animationsEnabled: false,
        sidebarWidth: 244,
      },
      create: {
        userId: user.id,
        themePreset: "needt",
        animationsEnabled: false,
        sidebarWidth: 244,
      },
    }),
    prisma.systemSettings.upsert({
      where: { id: "default" },
      update: { disableHomepage: false, publicSignup: false },
      create: {
        id: "default",
        disableHomepage: false,
        publicSignup: false,
        logDestination: "db",
        logLevel: "error",
      },
    }),
  ]);

  await prisma.task.deleteMany({
    where: {
      OR: [{ userId: user.id }, { id: { in: [...VISUAL_TEST_TASK_IDS] } }],
    },
  });
  await prisma.task.createMany({
    data: [
      {
        id: "visual-task-plan",
        userId: user.id,
        title: "Plan the launch",
        description:
          "<!--needt-rich-text:v1--><p>Review the brief and choose the <strong>next action</strong>.</p>",
        status: "todo",
        duration: 30,
        estimatedMinutes: 30,
        startDate: new Date("2026-07-16T00:00:00+02:00"),
        dueDate: new Date("2026-07-16T23:59:00+02:00"),
        isAutoScheduled: false,
      },
      {
        id: "visual-task-morning",
        userId: user.id,
        title: "Morning deep work",
        description:
          '<!--needt-rich-text:v1--><h2>Focus block</h2><ul data-type="taskList"><li data-checked="false"><p>Draft the first section</p></li></ul>',
        status: "todo",
        duration: 60,
        estimatedMinutes: 60,
        scheduledStart: new Date("2026-07-16T09:00:00+02:00"),
        scheduledEnd: new Date("2026-07-16T10:00:00+02:00"),
        startDate: new Date("2026-07-16T00:00:00+02:00"),
        dueDate: new Date("2026-07-16T23:59:00+02:00"),
        isAutoScheduled: true,
        autoScheduled: true,
      },
      {
        id: "visual-task-afternoon",
        userId: user.id,
        title: "Review calendar sync",
        description: "Check the latest provider status.",
        status: "todo",
        duration: 45,
        estimatedMinutes: 45,
        scheduledStart: new Date("2026-07-16T14:00:00+02:00"),
        scheduledEnd: new Date("2026-07-16T14:45:00+02:00"),
        startDate: new Date("2026-07-16T00:00:00+02:00"),
        dueDate: new Date("2026-07-16T23:59:00+02:00"),
        isAutoScheduled: true,
        autoScheduled: true,
      },
      {
        id: "visual-task-evening",
        userId: user.id,
        title: "Evening shutdown",
        status: "todo",
        duration: 20,
        estimatedMinutes: 20,
        scheduledStart: new Date("2026-07-16T18:30:00+02:00"),
        scheduledEnd: new Date("2026-07-16T18:50:00+02:00"),
        startDate: new Date("2026-07-16T00:00:00+02:00"),
        dueDate: new Date("2026-07-16T23:59:00+02:00"),
        isAutoScheduled: true,
        autoScheduled: true,
      },
    ],
  });
}
