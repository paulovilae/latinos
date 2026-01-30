import { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";

export default function BillingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="max-w-screen-2xl w-full mx-auto px-6 lg:px-10 py-8 space-y-10">
        <AppHeader />
        {children}
      </div>
    </>
  );
}
