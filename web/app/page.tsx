import { ChatLab } from "@/components/chat-lab";

const navItems = [
  { href: "#playground", label: "Playground" },
  { href: "#mode-switch", label: "Modes" },
  { href: "#scenario-lab", label: "Scenarios" },
  { href: "#observability", label: "Logs" }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.15),_transparent_22%),radial-gradient(circle_at_right,_rgba(59,130,246,0.16),_transparent_24%),linear-gradient(180deg,_#07111f_0%,_#0d1728_100%)] text-slate-50">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-rose-300">
              Session 3 Demo
            </p>
            <h1 className="font-serif text-2xl text-white">
              Guardrail Failure Lab
            </h1>
          </div>
          <nav className="hidden gap-3 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/50 hover:text-white"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-300">
              Real OpenAI, App-Layer Guardrails
            </p>
            <div className="space-y-4">
              <h2 className="max-w-3xl font-serif text-5xl leading-tight text-white md:text-7xl">
                One model. Three app behaviors. A much better demo.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Show that the provider already blocks the obvious jailbreak, then
                prove why your own guardrails still matter when retrieval content,
                tool output, and internal identifiers hit the application layer.
              </p>
            </div>
          </div>
          <div className="rounded-[2rem] border border-cyan-300/25 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(2,6,23,0.45)]">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">
              Suggested Live Run
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li>Start in Base OpenAI with the direct injection prompt.</li>
              <li>Switch to Vulnerable App and run the retrieval or tool scenario.</li>
              <li>Show the same model leaking app-sensitive details or unsafe actions.</li>
              <li>Switch to Guarded App and replay the exact same scenario.</li>
              <li>Use the logs panel to explain where provider safety ends.</li>
            </ul>
          </div>
        </div>
      </section>
      <ChatLab />
    </main>
  );
}
