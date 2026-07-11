import { createFileRoute } from "@tanstack/react-router";

import logoUrl from "@/components/logo.png";
import { RegistrationForm } from "@/components/registration/RegistrationForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Registration Closed | Indoor Cricket Rising League 3.0" },
      {
        name: "description",
        content: "Registration for Indoor Cricket Rising League 3.0 is now closed.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[oklch(0.95_0.027_213)] px-4 py-5 font-display text-slate-500 sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1500px] flex-col">
        <header className="mb-7 flex min-h-20 w-full max-w-full items-center rounded-[2rem] border border-white/80 bg-white/90 px-4 py-3 shadow-[0_24px_70px_-54px_oklch(0.42_0.035_250_/_0.75)] sm:px-8 sm:py-4">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <img
              src={logoUrl}
              alt="Indoor Cricket Rising League logo"
              className="h-14 w-20 shrink-0 object-contain sm:h-20 sm:w-32"
            />
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-tight tracking-normal text-slate-600 sm:text-2xl lg:text-[1.7rem]">
                Indoor Cricket Rising League 3.0
              </p>
              <p className="mt-0.5 text-sm font-medium text-slate-400 sm:text-base">
                Player registration
              </p>
            </div>
          </div>
        </header>
        <RegistrationForm />
      </div>
    </main>
  );
}
