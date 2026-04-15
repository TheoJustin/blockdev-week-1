import { ChatLab } from "@/components/chat-lab";

const navItems = [
  { href: "#playground", label: "Playground" },
  { href: "#attack-library", label: "Attacks" },
  { href: "#why-it-breaks", label: "Why It Breaks" }
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
              Intentionally Vulnerable by Design
            </p>
            <div className="space-y-4">
              <h2 className="max-w-3xl font-serif text-5xl leading-tight text-white md:text-7xl">
                Break the chatbot first. Then earn the fix.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                This first milestone recreates the exact failure mode you want on
                camera: direct prompt injection, indirect document injection, and
                tool-output hijacking that still get allowed into production.
              </p>
            </div>
          </div>
          <div className="rounded-[2rem] border border-rose-400/30 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(2,6,23,0.45)]">
            <p className="text-sm uppercase tracking-[0.28em] text-rose-300">
              Failure Conditions
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li>No prompt isolation</li>
              <li>No input guard</li>
              <li>No output validation</li>
              <li>Canary token included in the hidden prompt</li>
              <li>High-risk requests are logged but never blocked</li>
            </ul>
          </div>
        </div>
      </section>
      <ChatLab />
    </main>
  );
}
