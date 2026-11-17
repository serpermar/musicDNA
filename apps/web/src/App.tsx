import { apiPrefix } from '@musicdna/config';

export default function App() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />

      <section className="relative w-full max-w-2xl rounded-card border border-border bg-surface/80 p-10 text-center shadow-2xl backdrop-blur">
        <span className="inline-flex items-center rounded-pill bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-textMuted">
          Fase 1 · Fundación
        </span>
        <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight">
          <span className="bg-brand-gradient bg-clip-text text-transparent">MusicDNA</span>
        </h1>
        <p className="mt-4 text-lg text-textMuted">Your music. Your personality. Your DNA.</p>
        <p className="mx-auto mt-8 max-w-lg text-sm leading-relaxed text-textMuted/80">
          La estructura del proyecto ya está lista. El cuestionario, el perfil musical y las
          recomendaciones se incorporarán en las siguientes fases.
        </p>
        <code className="mt-8 inline-block rounded-lg border border-border bg-background px-3 py-2 text-xs text-textMuted">
          API base: {apiPrefix}
        </code>
      </section>
    </main>
  );
}
