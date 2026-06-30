import { createFileRoute } from "@tanstack/react-router";

import logoUrl from "@/components/logo.png";
import { RegistrationForm } from "@/components/registration/RegistrationForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Registration" },
      {
        name: "description",
        content: "Fill out the registration form to submit your details.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--gradient-surface)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(135deg,oklch(0.58_0.21_264_/_18%),oklch(0.76_0.16_198_/_16%),transparent)]" />
      <div className="relative mx-auto w-full max-w-7xl py-0 sm:py-4 lg:py-8">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-white/70 bg-card/90 px-5 py-1 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="Event logo"
              className="h-16 w-24 shrink-0 object-contain"
            />
            <div>
              <p className="text-lg font-black tracking-tight text-foreground">
                Indoor Cricket Rising League 3
              </p>
              <p className="text-xs font-medium text-muted-foreground">Player registration</p>
            </div>
          </div>
        </header>
        <RegistrationForm />
      </div>
    </main>
  );
}
