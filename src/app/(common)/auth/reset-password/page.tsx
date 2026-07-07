import { PasswordResetForm } from "@/components/auth/PasswordResetForm";

import { APP_NAME } from "@/lib/app-config";

export const metadata = {
  title: `Reset Password - ${APP_NAME}`,
  description: `Reset your ${APP_NAME} account password`,
};

export default function ResetPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <PasswordResetForm />
    </div>
  );
}
