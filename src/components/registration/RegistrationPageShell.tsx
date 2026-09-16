import { type ReactNode } from "react";

import bannerUrl from "@/assets/newbanner.jpeg";
import logoUrl from "@/assets/newlogo.png";

export function RegistrationPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="scorecard-surface relative min-h-screen overflow-x-clip bg-[var(--gradient-surface)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(110deg,oklch(0.19_0.045_155),oklch(0.29_0.07_153))]" />
      <div className="relative w-full">
        <Banner />
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex min-w-0 items-center justify-between border border-border/70 border-b-4 border-b-[var(--primary-glow)] bg-card px-3 py-2 shadow-[var(--shadow-soft)] sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="flex h-16 w-28 shrink-0 items-center justify-center bg-[#14100c] p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] sm:h-20 sm:w-32">
              <img
                src={logoUrl}
                alt="Avengers Community League logo"
                className="h-full w-full object-contain"
              />
            </span>
            <div className="min-w-0">
              <p className="font-display text-base font-black leading-tight tracking-tight text-foreground sm:text-lg">
                Avengers Community League 1.0
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--primary-glow)] sm:mt-0 sm:text-xs sm:tracking-[0.18em]">
                Player registration
              </p>
            </div>
          </div>
        </header>
        {children}

        {/* Footer credit */}
        <footer className="mt-8 border-t border-border/70 pt-4 text-center text-sm text-muted-foreground">
          Design and develop by{" "}
          <a
            href="https://www.web-wired.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            web-wired.net
          </a>
        </footer>
      </div>
    </main>
  );
}

function Banner() {
  return (
    <section
      aria-label="League promotional banner"
      className="relative w-full overflow-hidden bg-foreground"
    >
      <div className="relative h-[21.75vw] max-h-[480px] w-full overflow-hidden bg-[#100a06]">
        <img
          src={bannerUrl}
          alt="Avengers Community League promotional banner"
          className="h-full w-full object-contain object-top"
        />
      </div>
    </section>
  );
}
