import "server-only";

import { after } from "next/server";

import { sendEmail } from "@/actions/send-email";
import VerifyEmail from "@/emails/verify-email";
import ResetPassword from "@/emails/reset-password";
import { env } from "@/lib/env";

export async function sendVerificationEmail({
  user,
  url,
}: {
  user: { email: string; name?: string | null };
  url: string;
}) {
  after(async () => {
    if (!env.RESEND_API_KEY && process.env.NODE_ENV !== "production") {
      console.log("[auth-email] verification URL:", url);
      return;
    }
    try {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        react: VerifyEmail({ url }),
      });
    } catch (e) {
      console.error("Failed to send verification email:", e);
    }
    if (!env.EMAIL_FROM && process.env.NODE_ENV === "production") {
      console.error("EMAIL_FROM unset; auth mail cannot be delivered in production");
    }
  });
}

export async function sendResetPassword({
  user,
  url,
}: {
  user: { email: string; name?: string | null };
  url: string;
}) {
  after(async () => {
    if (!env.RESEND_API_KEY && process.env.NODE_ENV !== "production") {
      console.log("[auth-email] reset URL:", url);
      return;
    }
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        react: ResetPassword({ url }),
      });
    } catch (e) {
      console.error("Failed to send reset password email:", e);
    }
    if (!env.EMAIL_FROM && process.env.NODE_ENV === "production") {
      console.error("EMAIL_FROM unset; auth mail cannot be delivered in production");
    }
  });
}
