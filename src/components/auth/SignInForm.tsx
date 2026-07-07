"use client";

import { useState } from "react";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { APP_NAME } from "@/lib/app-config";
import { logger } from "@/lib/logger";

const LOG_SOURCE = "SignInForm";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Authentication failed", {
          description: "Please check your email and password and try again.",
        });
      } else {
        toast.success("Signed in successfully");

        // The token is set in the background, so we'll redirect after a minimal delay
        // to ensure the token is available for the next request
        setTimeout(() => {
          // Force a hard navigation to ensure the middleware re-evaluates with the new token
          window.location.href = "/calendar";
        }, 100);
      }
    } catch (error) {
      logger.error(
        "Error signing in",
        { error: error instanceof Error ? error.message : "Unknown error" },
        LOG_SOURCE
      );
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Welcome to {APP_NAME}
        </CardTitle>
        <CardDescription>Sign in to your planner to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="text-right">
              <Button
                variant="link"
                className="h-auto p-0 text-sm text-muted-foreground"
                onClick={() => router.push("/auth/reset-password")}
                type="button"
              >
                Forgot password?
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Single-user local planner. No public signup or team access.
      </CardFooter>
    </Card>
  );
}
