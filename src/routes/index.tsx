import { createFileRoute } from "@tanstack/react-router";

import { RegistrationForm } from "@/components/registration/RegistrationForm";
import { RegistrationPageShell } from "@/components/registration/RegistrationPageShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Avengers Community League 1.0 | Player Registration" },
      {
        name: "description",
        content: "Register to play in Avengers Community League 1.0.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <RegistrationPageShell>
      <RegistrationForm submitPath="/api/registrations" />
    </RegistrationPageShell>
  );
}
