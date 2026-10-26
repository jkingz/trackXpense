"use server";

import type { ReactNode } from "react";
import { Resend } from "resend";

import { env } from "@/lib/env";

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[];
  subject: string;
  react: ReactNode;
}) {
  const resend = new Resend(env.RESEND_API_KEY || "");

  try {
    const data = await resend.emails.send({
      from: env.EMAIL_FROM || "Finance App <onboarding@resend.dev>",
      to,
      subject,
      react,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
