const contacts = [
  {
    name: "HUSSEIN SANCHA",
    phone: "050-8759122",
    href: "tel:0508759122",
  },
  {
    name: "QASIM ALI",
    phone: "050-7862132",
    href: "tel:0507862132",
  },
  {
    name: "QUAID JOHER",
    phone: "055-6086529",
    href: "tel:0556086529",
  },
];

export function RegistrationForm() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 px-5 py-14 shadow-[0_35px_90px_-55px_oklch(0.42_0.03_250_/_0.55)] sm:px-10 sm:py-16 lg:min-h-[640px] lg:px-16 lg:py-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <div className="inline-flex rounded-full border border-rose-200/75 bg-white px-6 py-2 text-[0.68rem] font-bold uppercase tracking-[0.48em] text-rose-400 shadow-sm">
          Registration Closed
        </div>

        <h1 className="mt-7 max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-normal text-slate-600 sm:text-5xl lg:text-6xl">
          Registration for ICRL 3.0 is over
        </h1>

        <div className="mt-7 space-y-2 text-lg font-medium leading-8 text-slate-400 sm:text-xl">
          <p>The online registration form is no longer accepting new submissions.</p>
          <p>Please contact the organizers below for any follow-up questions.</p>
        </div>
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl gap-4 border-t border-slate-100 pt-8 sm:mt-16 sm:grid-cols-3 sm:gap-0 lg:mt-20">
        {contacts.map((contact) => (
          <div
            key={contact.phone}
            className="px-4 py-4 text-center sm:px-7 sm:py-3 sm:text-left [&:not(:first-child)]:sm:border-l [&:not(:first-child)]:sm:border-slate-100"
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
              {contact.name}
            </p>
            <a
              href={contact.href}
              className="mt-4 block font-display text-2xl font-semibold tracking-normal text-slate-600 transition-colors hover:text-slate-800"
              aria-label={`Call ${contact.name.toLowerCase()} at ${contact.phone}`}
            >
              {contact.phone}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
