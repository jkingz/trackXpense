import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

function Page() {
  return (
    <Suspense>
      <SignUp />
    </Suspense>
  );
}

export default Page;
