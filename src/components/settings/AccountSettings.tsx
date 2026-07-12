"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function AccountSettings() {
  const { data: session } = useSession();

  return (
    <SettingsSection
      title="Account"
      description="Your signed-in planner profile. Calendar connections are managed in Calendars."
    >
      <SettingRow
        label="Profile"
        description="The account currently signed in to this planner."
      >
        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt=""
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-[#2B2F31]" />
          )}
          <div>
            <p className="text-sm font-medium text-[#F2F2F2]">
              {session?.user?.name || "Planner account"}
            </p>
            <p className="text-sm text-[#9BA1A6]">
              {session?.user?.email || "Loading account details…"}
            </p>
          </div>
        </div>
      </SettingRow>
    </SettingsSection>
  );
}
