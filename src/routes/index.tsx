import { createFileRoute } from "@tanstack/react-router";

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
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[var(--shadow-soft)] ring-1 ring-primary/5 backdrop-blur-xl sm:p-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Registration</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Please complete the form below to submit your registration.
        </p>

        <div className="mt-8">
          <RegistrationForm />
        </div>
      </div>
    </main>
  );
}
