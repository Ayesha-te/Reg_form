import { createFileRoute } from "@tanstack/react-router";

import { RegistrationForm } from "@/components/registration/RegistrationForm";
import { RegistrationPageShell } from "@/components/registration/RegistrationPageShell";

export const Route = createFileRoute("/private-registration-7h4k9m")({
  head: () => ({
    meta: [
      { title: "Avengers Community League 1.0 | Player Registration" },
      {
        name: "description",
        content: "Register to play in Avengers Community League 1.0.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PrivateRegistration,
});

function PrivateRegistration() {
  return (
    <RegistrationPageShell>
      <RegistrationForm submitPath="/api/private-registration-7h4k9m" />
    </RegistrationPageShell>
  );
}
