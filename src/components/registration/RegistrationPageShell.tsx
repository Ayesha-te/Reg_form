import { useEffect, useState, type ReactNode } from "react";

import bannerOneUrl from "@/assets/Black and Red Modern Podcast Sport LinkedIn Banner.png";
import bannerTwoUrl from "@/assets/ChatGPT Image Jul 21, 2026, 08_10_21 PM.png";
import bannerThreeUrl from "@/assets/Gemini_Generated_Image_v5wuawv5wuawv5wu.png";
import logoUrl from "@/components/logo.png";

const banners = [
  { src: bannerOneUrl, alt: "Avengers Community League event banner" },
  { src: bannerTwoUrl, alt: "Avengers Community League promotional banner" },
  { src: bannerThreeUrl, alt: "Avengers Community League sponsor banner" },
];

export function RegistrationPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="scorecard-surface relative min-h-screen overflow-x-clip bg-[var(--gradient-surface)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(110deg,oklch(0.19_0.045_155),oklch(0.29_0.07_153))]" />
      <div className="relative w-full">
        <BannerSlideshow />
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex min-w-0 items-center justify-between border-b-4 border-[var(--primary-glow)] bg-foreground px-3 py-2 shadow-[var(--shadow-soft)] sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img
              src={logoUrl}
              alt="STRIDE tournament logo"
              className="h-14 w-20 shrink-0 object-contain sm:h-16 sm:w-24"
            />
            <div className="min-w-0">
              <p className="font-display text-base font-black leading-tight tracking-tight text-primary-foreground sm:text-lg">
                Avengers Community League 1.0
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--primary-glow)] sm:mt-0 sm:text-xs sm:tracking-[0.18em]">
                Player registration
              </p>
            </div>
          </div>
        </header>
        {children}
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
