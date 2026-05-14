import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface PageHeroProps {
  eyebrow?: string;
  EyebrowIcon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
  backgroundImage?: string;
}

export function PageHero({ eyebrow, EyebrowIcon, title, description, actions, backgroundImage }: PageHeroProps) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl p-8 md:p-10 text-primary-foreground"
      style={{ backgroundImage: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
    >
      {backgroundImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-40 mix-blend-luminosity"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, color-mix(in oklab, var(--primary) 88%, transparent) 0%, color-mix(in oklab, var(--primary) 60%, transparent) 50%, color-mix(in oklab, var(--primary) 25%, transparent) 100%)" }}
          />
        </>
      )}
      <div
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ backgroundImage: "var(--gradient-gold)" }}
      />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              {EyebrowIcon && <EyebrowIcon className="h-3.5 w-3.5" />} {eyebrow}
            </span>
          )}
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
          {description && <p className="mt-3 text-base md:text-lg text-white/90">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}
