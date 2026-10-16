import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

function Page() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}

export default Page;
