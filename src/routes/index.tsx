import { createFileRoute } from "@tanstack/react-router";

import logoUrl from "@/components/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Registration Closed" },
      {
        name: "description",
        content: "Registration for Indoor Cricket Rising League 3.0 is closed.",
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
            <img src={logoUrl} alt="Event logo" className="h-16 w-24 shrink-0 object-contain" />
            <div>
              <p className="text-lg font-black tracking-tight text-foreground">
                Indoor Cricket Rising League 3.0
              </p>
              <p className="text-xs font-medium text-muted-foreground">Player registration</p>
            </div>
          </div>
        </header>
        <RegistrationClosed />
      </div>
    </main>
  );
}

function RegistrationClosed() {
  const contacts = [
    { name: "Hussein Sancha", phone: "050-8759122", href: "tel:0508759122" },
    { name: "Qasim Ali", phone: "050-7862132", href: "tel:0507862132" },
    { name: "Quaid Joher", phone: "055-6086529", href: "tel:0556086529" },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-card/95 px-5 py-16 text-center shadow-[var(--shadow-elegant)] ring-1 ring-primary/5 backdrop-blur-xl sm:px-9 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-primary opacity-70" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-5 inline-flex items-center rounded-full border border-destructive/15 bg-destructive/5 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.45em] text-destructive">
          Registration closed
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
          Registration for ICRL 3.0 is over
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-xl">
          The online registration form is no longer accepting new submissions. Please contact the
          organizers below for any follow-up questions.
        </p>

        <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
          {contacts.map((contact) => (
            <a
              key={contact.phone}
              href={contact.href}
              className="rounded-2xl border border-border/70 bg-background/70 p-5 shadow-[var(--shadow-soft)] transition-colors hover:border-primary/30 hover:bg-background"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {contact.name}
              </p>
              <p className="mt-4 font-display text-2xl font-bold tabular-nums text-foreground">
                {contact.phone}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
