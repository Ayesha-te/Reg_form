import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Database, ImagePlus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "Thank you | Registration received" },
      { name: "description", content: "Your registration has been received." },
    ],
  }),
  component: ThankYou,
});

function ThankYou() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16"
      style={{ backgroundImage: "var(--gradient-surface)" }}
    >
      <div className="absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-card/95 p-8 text-center shadow-[var(--shadow-elegant)] backdrop-blur">
        <div
          className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl text-primary-foreground shadow-[var(--shadow-glow)]"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h1 className="text-3xl font-black tracking-tight">Registration saved!</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          The form data has been stored in the local SQLite database, and the photo path is saved
          with the registration record.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <StatusCard icon={<Database className="h-4 w-4" />} title="Data saved" />
          <StatusCard icon={<ImagePlus className="h-4 w-4" />} title="Photo stored" />
        </div>

        <Button asChild className="mt-7 h-11 rounded-xl px-6 font-semibold">
          <Link to="/">Submit another</Link>
        </Button>
      </div>
    </main>
  );
}

function StatusCard({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
      <div className="mb-2 inline-flex rounded-xl bg-primary/10 p-2 text-primary">{icon}</div>
      <p className="text-sm font-semibold">{title}</p>
    </div>
  );
}
