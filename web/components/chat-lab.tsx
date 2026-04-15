"use client";

import {
  AlertTriangle,
  Bot,
  ChevronRight,
  ClipboardList,
  ShieldCheck,
  ShieldOff
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_LOGS,
  DEMO_MODES,
  DEMO_SCENARIOS,
  getModeById,
  getScenarioById,
  INITIAL_MESSAGES,
  type ChatMessage,
  type DemoApiResponse,
  type DemoModeId,
  type DemoScenarioId,
  type GuardrailLog
} from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type ApiHealth = {
  model: string;
  openai_configured: boolean;
  status: string;
};

function getModeTone(modeId: DemoModeId) {
  if (modeId === "guarded_app") {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      card: "border-emerald-200 bg-emerald-50/60"
    };
  }

  if (modeId === "vulnerable_app") {
    return {
      badge: "border-rose-200 bg-rose-50 text-rose-700",
      card: "border-rose-200 bg-rose-50/70"
    };
  }

  return {
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    card: "border-blue-200 bg-blue-50/70"
  };
}

function getSurfaceTone(surface: "direct" | "retrieval" | "tool") {
  if (surface === "tool") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (surface === "retrieval") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getRiskTone(log: GuardrailLog) {
  if (log.riskScore >= 0.8) {
    return {
      badge: "critical",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      barClass: "bg-rose-500"
    };
  }

  if (log.riskScore >= 0.4) {
    return {
      badge: "elevated",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
      barClass: "bg-amber-500"
    };
  }

  return {
    badge: "low",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    barClass: "bg-emerald-500"
  };
}

export function ChatLab() {
  const [selectedMode, setSelectedMode] = useState<DemoModeId>("base_openai");
  const [selectedScenario, setSelectedScenario] =
    useState<DemoScenarioId>("direct_injection");
  const [draft, setDraft] = useState(
    getScenarioById("direct_injection").recommendedPrompt
  );
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [logs, setLogs] = useState<GuardrailLog[]>(DEFAULT_LOGS);
  const [isResponding, setIsResponding] = useState(false);
  const [apiHealth, setApiHealth] = useState<ApiHealth | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const currentMode = getModeById(selectedMode);
  const currentScenario = getScenarioById(selectedScenario);
  const currentModeTone = getModeTone(selectedMode);

  function resetDemo(nextPrompt = currentScenario.recommendedPrompt) {
    setMessages(INITIAL_MESSAGES);
    setLogs(DEFAULT_LOGS);
    setDraft(nextPrompt);
  }

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const response = await fetch(`${DEFAULT_API_BASE_URL}/health`);
        if (!response.ok) {
          throw new Error(`Health check failed with status ${response.status}`);
        }

        const health = (await response.json()) as ApiHealth;
        if (isMounted) {
          setApiHealth(health);
          setApiError(null);
        }
      } catch (error) {
        if (isMounted) {
          setApiHealth(null);
          setApiError(
            error instanceof Error
              ? error.message
              : "Unable to reach the demo API."
          );
        }
      }
    }

    void checkHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSend() {
    const prompt = draft.trim();

    if (!prompt || isResponding) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt
    };

    setMessages((current) => [...current, userMessage]);
    setIsResponding(true);

    try {
      const response = await fetch(`${DEFAULT_API_BASE_URL}/demo/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt,
          mode: selectedMode,
          scenario: selectedScenario
        })
      });

      let payload: DemoApiResponse | { detail?: string };

      try {
        payload = (await response.json()) as DemoApiResponse | { detail?: string };
      } catch {
        payload = {};
      }

      if (!response.ok) {
        const detail =
          "detail" in payload && typeof payload.detail === "string"
            ? payload.detail
            : `Demo API error (${response.status})`;
        throw new Error(detail);
      }

      const demoResponse = payload as DemoApiResponse;

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: demoResponse.message,
          blocked: demoResponse.blocked,
          leaked: demoResponse.leaked
        }
      ]);
      setLogs(demoResponse.logs);
      setApiHealth((current) =>
        current
          ? {
              ...current,
              model: demoResponse.model,
              openai_configured: demoResponse.openai_configured
            }
          : {
              model: demoResponse.model,
              openai_configured: demoResponse.openai_configured,
              status: "ok"
            }
      );
      setApiError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The live OpenAI demo call failed.";

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            `Live demo request failed.\n\n${message}\n\n` +
            `Make sure the API is running on ${DEFAULT_API_BASE_URL} and that OPENAI_API_KEY is set in api/.env.`,
          blocked: true
        }
      ]);
      setLogs([
        {
          id: "demo-failure",
          stage: "demo operation",
          decision: "failed open",
          riskScore: 0.88,
          reason:
            "The UI submitted the scenario, but the live backend was unavailable or misconfigured."
        }
      ]);
      setApiError(message);
    } finally {
      setIsResponding(false);
    }
  }

  const visibleTurns = Math.max(messages.length - 1, 0);

  return (
    <div className="mx-auto grid max-w-7xl items-start gap-6 px-6 pb-20 lg:grid-cols-[minmax(0,1.08fr)_minmax(21rem,0.92fr)]">
      <section className="space-y-4" id="playground">
        <div className="flex flex-wrap gap-2">
          <Badge className="border-slate-200 bg-white text-slate-600">
            Live OpenAI Backend
          </Badge>
          <Badge className="border-slate-200 bg-white text-slate-600">
            Mode: {currentMode.label}
          </Badge>
          <Badge className="border-slate-200 bg-white text-slate-600">
            Scenario: {currentScenario.label}
          </Badge>
          <Badge
            className={
              apiHealth?.openai_configured
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }
          >
            {apiHealth?.openai_configured
              ? `API connected: ${apiHealth.model}`
              : "API not connected"}
          </Badge>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="space-y-5 border-b border-slate-200 bg-slate-50/80">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <Badge className="w-fit border-slate-200 bg-white text-slate-600">
                  Demo Console
                </Badge>
                <div className="space-y-2">
                  <CardTitle className="text-3xl">
                    Guardrail Comparison Chat
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-base">
                    {currentMode.description}
                  </CardDescription>
                </div>
              </div>

              <div
                className={cn(
                  "min-w-[15rem] rounded-[1.25rem] border p-4",
                  currentModeTone.card
                )}
              >
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                  Current Run
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {currentMode.label}
                </p>
                <p className="text-sm text-slate-600">{currentScenario.label}</p>
                <Badge className={cn("mt-3 w-fit", currentModeTone.badge)}>
                  {currentMode.shortLabel}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                  Model
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {apiHealth?.model ?? "Waiting for API"}
                </p>
              </div>
              <div className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                  Attack Surface
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {currentScenario.label}
                  </p>
                  <Badge className={cn(getSurfaceTone(currentScenario.surface))}>
                    {currentScenario.surface}
                  </Badge>
                </div>
              </div>
              <div className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                  Demo Goal
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Compare the exact same prompt across provider safety, unsafe app
                  glue, and guarded app behavior.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-5 p-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Live conversation
                  </p>
                  <p className="text-sm leading-6 text-slate-500">
                    Send the same prompt through each mode and compare the result.
                  </p>
                </div>
                <Badge className="border-slate-200 bg-white text-slate-600">
                  {visibleTurns === 0
                    ? "Ready to run"
                    : `${visibleTurns} visible turn${visibleTurns === 1 ? "" : "s"}`}
                </Badge>
              </div>
              <Separator className="my-4 bg-slate-200" />
              <div className="max-h-[30rem] space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "assistant" ? "justify-start" : "justify-end"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full rounded-[1.25rem] border px-4 py-4 shadow-sm",
                        message.role === "assistant"
                          ? "max-w-[42rem] border-slate-200 bg-white text-slate-900"
                          : "max-w-[30rem] border-slate-900 bg-slate-900 text-white"
                      )}
                    >
                      <div
                        className={cn(
                          "mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em]",
                          message.role === "assistant"
                            ? "text-slate-500"
                            : "text-slate-300"
                        )}
                      >
                        {message.role === "assistant" ? (
                          <Bot className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span>{message.role}</span>
                        {message.blocked ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] text-amber-700">
                            blocked by app guardrail
                          </span>
                        ) : null}
                        {message.leaked ? (
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] text-rose-700">
                            leaked app-sensitive data
                          </span>
                        ) : null}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                {isResponding ? (
                  <div className="flex justify-start">
                    <div className="max-w-[42rem] rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500 shadow-sm">
                      Sending this run to the live OpenAI demo backend...
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Prompt editor
                  </p>
                  <p className="text-sm leading-6 text-slate-500">
                    Use the recommended scenario prompt or type your own.
                  </p>
                </div>

                <Textarea
                  className="min-h-36 bg-slate-50 text-base"
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Use the recommended prompt for the selected scenario or type your own."
                  value={draft}
                />

                <div className="flex flex-wrap gap-3">
                  <Button className="min-w-40" onClick={handleSend}>
                    Run This Mode
                  </Button>
                  <Button
                    className="min-w-32"
                    onClick={() => setDraft(currentScenario.recommendedPrompt)}
                    variant="secondary"
                  >
                    Load Prompt
                  </Button>
                  <Button
                    className="min-w-32"
                    onClick={() => resetDemo(currentScenario.recommendedPrompt)}
                    variant="outline"
                  >
                    Reset Demo
                  </Button>
                </div>

                {apiError ? (
                  <p className="text-sm leading-6 text-rose-700">
                    Live API issue: {apiError}
                  </p>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">
                    This panel calls{" "}
                    <code className="rounded-lg bg-slate-100 px-2 py-1 text-[13px] text-slate-700">
                      {DEFAULT_API_BASE_URL}/demo/chat
                    </code>{" "}
                    with the selected mode and scenario.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-4">
        <section className="space-y-4" id="mode-switch">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-slate-700" />
                <CardTitle className="text-xl">Mode switch</CardTitle>
              </div>
              <CardDescription>
                Same model, different application behavior.
              </CardDescription>
            </CardHeader>
            <Separator className="bg-slate-200/80" />
            <CardContent className="space-y-3 pt-6">
              {DEMO_MODES.map((mode) => (
                <button
                  key={mode.id}
                  className={cn(
                    "w-full rounded-[1.25rem] border p-4 text-left transition",
                    selectedMode === mode.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                  )}
                  onClick={() => {
                    setSelectedMode(mode.id);
                    resetDemo(currentScenario.recommendedPrompt);
                  }}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold">{mode.label}</p>
                      <p
                        className={cn(
                          "mt-2 text-sm leading-6",
                          selectedMode === mode.id
                            ? "text-slate-300"
                            : "text-slate-500"
                        )}
                      >
                        {mode.description}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "min-w-[8.5rem] justify-center",
                        selectedMode === mode.id
                          ? "border-white/20 bg-white/10 text-white"
                          : getModeTone(mode.id).badge
                      )}
                    >
                      {mode.shortLabel}
                    </Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4" id="scenario-lab">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldOff className="h-5 w-5 text-slate-700" />
                <CardTitle className="text-xl">Scenario lab</CardTitle>
              </div>
              <CardDescription>
                Pick the attack surface you want to narrate live.
              </CardDescription>
            </CardHeader>
            <Separator className="bg-slate-200/80" />
            <CardContent className="space-y-3 pt-6">
              {DEMO_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  className={cn(
                    "w-full rounded-[1.25rem] border p-4 text-left transition",
                    selectedScenario === scenario.id
                      ? "border-slate-900 bg-white"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                  )}
                  onClick={() => {
                    setSelectedScenario(scenario.id);
                    resetDemo(scenario.recommendedPrompt);
                  }}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-950">
                        {scenario.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {scenario.description}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "min-w-[7.75rem] justify-center",
                        getSurfaceTone(scenario.surface)
                      )}
                    >
                      {scenario.surface}
                    </Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4" id="context-preview">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-slate-700" />
                <CardTitle className="text-xl">
                  {currentScenario.assetLabel}
                </CardTitle>
              </div>
              <CardDescription>
                This is the untrusted app-side content used by the vulnerable and
                guarded modes.
              </CardDescription>
            </CardHeader>
            <Separator className="bg-slate-200/80" />
            <CardContent className="pt-6">
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {currentScenario.assetPreview}
                </pre>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4" id="observability">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-slate-700" />
                <CardTitle className="text-xl">Observability</CardTitle>
              </div>
              <CardDescription>
                Latest run only. Watch where the provider stops and where the
                app takes over.
              </CardDescription>
            </CardHeader>
            <Separator className="bg-slate-200/80" />
            <CardContent className="space-y-3 pt-6">
              {/* TODO(Session 3): Expand this into a small run history or anomaly
              dashboard so the observability section maps more closely to the
              final 5-layer architecture story. */}
              {logs.map((log) => {
                const tone = getRiskTone(log);
                const width = `${Math.max(log.riskScore * 100, 8)}%`;

                return (
                  <div
                    key={log.id}
                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                          {log.stage}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {log.decision}
                        </p>
                      </div>
                      <Badge className={tone.badgeClass}>{tone.badge}</Badge>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className={cn("h-2 rounded-full", tone.barClass)}
                          style={{ width }}
                        />
                      </div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Risk score {log.riskScore.toFixed(2)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {log.reason}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4" id="why-guardrails">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-slate-700" />
                <CardTitle className="text-xl">Narration cue</CardTitle>
              </div>
              <CardDescription>
                Keep the explanation simple while the UI shows the contrast.
              </CardDescription>
            </CardHeader>
            <Separator className="bg-slate-200/80" />
            <CardContent className="space-y-4 pt-6">
              {/* TODO(Session 3): Add the visible 5-layer architecture diagram
              here or directly below this card so the close of the demo lands on
              the full guardrail stack instead of text only. */}
              <p className="text-sm leading-7 text-slate-700">
                {currentMode.takeaway}
              </p>
              <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                Minimal rule of thumb: model safety helps, but your app still
                decides what data becomes trusted, what actions are allowed, and
                what output is safe to release.
              </div>
            </CardContent>
          </Card>
        </section>
      </aside>
    </div>
  );
}
