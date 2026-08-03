import { createFileRoute } from "@tanstack/react-router";

import { RegistrationPageShell } from "@/components/registration/RegistrationPageShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Indoor Community League 1.0 | Player Registration" },
      {
        name: "description",
        content: "Register to play in Indoor Community League 1.0.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <RegistrationPageShell>
      <RegistrationClosed />
    </RegistrationPageShell>
  );
}

function RegistrationClosed() {
  const contacts = [
    { name: "Hussein Sancha", phone: "050-8759122", href: "tel:0508759122" },
    { name: "Qasim Ali", phone: "050-7862132", href: "tel:0507862132" },
    { name: "Quaid Joher", phone: "055-6086529", href: "tel:0556086529" },
  ];

  return (
    <section className="relative overflow-hidden border border-white/70 bg-card/95 px-5 py-16 text-center shadow-[var(--shadow-elegant)] ring-1 ring-primary/5 backdrop-blur-xl sm:px-9 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-primary opacity-70" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-5 inline-flex items-center rounded-full border border-destructive/15 bg-destructive/5 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.45em] text-destructive">
          Registration closed
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
          The squad list is locked for Indoor Community League 1.0
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-xl">
          Registrations are now closed, and no new player entries are being accepted. If you missed
          this round, be ready early for the next one because spots move fast and late entries
          cannot be guaranteed.
        </p>
        <p className="mx-auto mt-4 max-w-2xl font-display text-2xl font-black leading-snug text-primary sm:text-3xl">
          Next time, hurry before the whistle blows.
        </p>

        <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
          {contacts.map((contact) => (
            <a
              key={contact.phone}
              href={contact.href}
              className="border border-border/70 bg-background/70 p-5 shadow-[var(--shadow-soft)] transition-colors hover:border-primary/30 hover:bg-background"
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
