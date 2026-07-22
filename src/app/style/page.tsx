import { DesignSystemLab } from "@/components/ui/design-system-lab";

import { APP_NAME } from "@/lib/app-config";

export const metadata = {
  title: `${APP_NAME} UI system`,
};

export default function StylePage() {
  return <DesignSystemLab />;
}
