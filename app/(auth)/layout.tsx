import React from "react";

import { AuthPanel } from "@/components/auth/auth-panel";

/**
 * Every auth route gets the same split: pitch on the left, form on the right.
 * The grid lives here so sign-in and sign-up cannot drift. Below `lg` the form
 * comes first — a phone visitor should not scroll past the whole pitch to reach
 * the fields.
 */
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid flex-1 items-stretch lg:grid-cols-2">
      <AuthPanel />
      <div className="order-1 flex items-center justify-center px-4 py-14 lg:order-2 lg:py-20">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
