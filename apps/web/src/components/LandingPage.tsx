import Link from "next/link";

interface FaqEntry {
  question: string;
  answer: string;
}

interface LandingPageProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  highlights: string[];
  steps: { title: string; body: string }[];
  faq: FaqEntry[];
}

export function buildFaqJsonLd(faq: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

export function LandingPage({
  eyebrow,
  title,
  description,
  primaryCtaLabel = "Open playground",
  primaryCtaHref = "/",
  secondaryCtaLabel = "Browse the GitHub repo",
  secondaryCtaHref = "https://github.com/chayprabs/asciidoctor-online",
  highlights,
  steps,
  faq,
}: LandingPageProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f3ff,_#fffdf8_45%,_#ffffff_100%)] text-stone-900">
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-teal-700">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-stone-600">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryCtaHref}
              className="rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white hover:bg-teal-800"
            >
              {primaryCtaLabel}
            </Link>
            <a
              href={secondaryCtaHref}
              className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:text-stone-950"
              target="_blank"
              rel="noreferrer"
            >
              {secondaryCtaLabel}
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {highlights.map((highlight) => (
            <div
              key={highlight}
              className="rounded-3xl border border-stone-200 bg-white/80 p-4 text-sm text-stone-700 shadow-sm backdrop-blur"
            >
              {highlight}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white/80">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              How it works
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-600">
              AsciidocCloud keeps the workflow simple: edit a multi-file project,
              compile through a warm JRuby worker, and download HTML, PDF, EPUB,
              DocBook, or the full project archive.
            </p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-3xl border border-stone-200 bg-stone-50 p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-stone-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-12">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {faq.map((entry) => (
            <article
              key={entry.question}
              className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-base font-semibold text-stone-950">
                {entry.question}
              </h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">{entry.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
