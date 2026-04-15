import { ChatLab } from "@/components/chat-lab";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "#playground", label: "Playground" },
  { href: "#mode-switch", label: "Modes" },
  { href: "#scenario-lab", label: "Scenarios" },
  { href: "#observability", label: "Logs" }
];

const runOrder = [
  "Start in Base OpenAI with the direct prompt injection attack.",
  "Switch to Vulnerable App and replay retrieval or tool hijacking.",
  "Finish in Guarded App and show the same model behaving safely."
];

export default function HomePage() {
  return (
    <main className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.34em] text-slate-500">
              Session 3 Demo
            </p>
            <h1 className="font-serif text-2xl text-slate-950">
              Guardrail Failure Lab
            </h1>
          </div>
          <nav className="hidden gap-2 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-12 pt-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-start">
          <div className="space-y-6">
            <Badge className="w-fit border-slate-200 bg-white text-slate-600">
              Real OpenAI Demo
            </Badge>
            <div className="space-y-4">
              <h2 className="max-w-4xl font-serif text-5xl leading-tight text-slate-950 md:text-6xl">
                Guardrail story TH.
              </h2>
              <p className="max-w-3xl text-lg leading-8 text-slate-600">
                This lab compares provider safety, intentionally vulnerable app
                glue code, and app-layer guardrails using the same OpenAI
                backend. The point is not that the model is weak. The point is
                that your application still owns the risk boundary.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                  Base OpenAI
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Show that the obvious jailbreak is often refused.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                  Vulnerable App
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Show how unsafe prompt construction still creates risk.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                  Guarded App
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Show how your app enforces policy after the model responds.
                </p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <Badge className="w-fit border-slate-200 bg-slate-50 text-slate-600">
                Live Demo Run
              </Badge>
              <CardTitle className="text-2xl">Suggested sequence</CardTitle>
              <CardDescription>
                Use the same app in three passes so the contrast is obvious on
                screen.
              </CardDescription>
            </CardHeader>
            <Separator className="bg-slate-200/80" />
            <CardContent className="space-y-4 pt-6">
              {runOrder.map((item, index) => (
                <div
                  key={item}
                  className="flex gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900 shadow-sm">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <ChatLab />
    </main>
  );
}
