import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import logoUrl from "@/components/logo.png";
import bannerOneUrl from "@/assets/Black and Red Modern Podcast Sport LinkedIn Banner.png";
import bannerTwoUrl from "@/assets/ChatGPT Image Jul 21, 2026, 08_10_21 PM.png";
import bannerThreeUrl from "@/assets/Gemini_Generated_Image_v5wuawv5wuawv5wu.png";

const banners = [
  { src: bannerOneUrl, alt: "Indoor Community League event banner" },
  { src: bannerTwoUrl, alt: "Indoor Community League promotional banner" },
  { src: bannerThreeUrl, alt: "Indoor Community League sponsor banner" },
];

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
    <main className="scorecard-surface relative min-h-screen overflow-x-clip bg-[var(--gradient-surface)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(110deg,oklch(0.19_0.045_155),oklch(0.29_0.07_153))]" />
      <div className="relative w-full">
        <BannerSlideshow />
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between border-b-4 border-[var(--primary-glow)] bg-foreground px-5 py-2 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="STRIDE tournament logo"
              className="h-16 w-24 shrink-0 object-contain"
            />
            <div>
              <p className="font-display text-lg font-black tracking-tight text-primary-foreground">
                Indoor Community League 1.0
              </p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary-glow)]">
                Player registration
              </p>
            </div>
          </div>
        </header>
        <RegistrationClosed />
      </div>
    </main>
  );
}

function BannerSlideshow() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isPaused, prefersReducedMotion]);

  return (
    <section
      aria-label="League promotional banners"
      className="group relative w-full overflow-hidden bg-foreground"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <div className="relative h-[21.75vw] max-h-[480px] w-full overflow-hidden bg-[#100a06]">
        {banners.map((banner, index) => (
          <img
            key={banner.src}
            src={banner.src}
            alt={banner.alt}
            aria-hidden={index !== activeSlide}
            className={`absolute inset-0 h-full w-full object-contain object-top transition-opacity duration-700 motion-reduce:transition-none ${
              index === activeSlide ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 -bottom-1 flex justify-center gap-2 sm:bottom-0">
        {banners.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Show banner ${index + 1}`}
            aria-current={index === activeSlide ? "true" : undefined}
            onClick={() => setActiveSlide(index)}
            className={`h-2.5 w-2.5 border border-[#f4d687] shadow-[0_1px_4px_rgba(0,0,0,0.7)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none sm:h-3 sm:w-3 ${
              index === activeSlide
                ? "bg-[var(--primary-glow)]"
                : "bg-[#1b1009]/80 hover:bg-[#f4d687]"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function RegistrationClosed() {
  const contacts = [
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
          this round, be ready early for the next one because spots move fast and late entries cannot
          be guaranteed.
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
