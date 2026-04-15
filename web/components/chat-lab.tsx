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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ApiHealth = {
  model: string;
  openai_configured: boolean;
  status: string;
};

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

  return (
    <div className="mx-auto grid max-w-7xl items-start gap-8 px-6 pb-20 lg:grid-cols-[minmax(23rem,0.94fr)_minmax(30rem,1.06fr)] xl:grid-cols-[minmax(24rem,0.92fr)_minmax(32rem,1.08fr)]">
      <section className="space-y-6" id="playground">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="border-cyan-300/40 bg-cyan-400/15 text-cyan-100">
            Live OpenAI Backend
          </Badge>
          <Badge className="border-white/10 bg-white/5 text-slate-200">
            Mode: {currentMode.label}
          </Badge>
          <Badge className="border-white/10 bg-white/5 text-slate-200">
            Scenario: {currentScenario.label}
          </Badge>
          <Badge
            className={
              apiHealth?.openai_configured
                ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
                : "border-white/10 bg-white/5 text-slate-300"
            }
          >
            {apiHealth?.openai_configured
              ? `API connected: ${apiHealth.model}`
              : "API not connected"}
          </Badge>
        </div>
        <Card className="overflow-hidden border-white/10 bg-slate-950/60">
          <CardHeader className="border-b border-white/10 bg-white/[0.03]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl text-white">
                  Guardrail Comparison Chat
                </CardTitle>
                <CardDescription className="max-w-2xl text-slate-400">
                  {currentMode.description}
                </CardDescription>
              </div>
              <div
                className={`min-w-[12rem] shrink-0 rounded-full border px-4 py-2 text-center text-sm ${
                  currentMode.id === "guarded_app"
                    ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                    : "border-rose-400/30 bg-rose-500/10 text-rose-100"
                }`}
              >
                {currentMode.shortLabel}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-6">
            <div className="max-h-[30rem] space-y-4 overflow-y-auto rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`w-full rounded-[1.25rem] border px-4 py-3 ${
                      message.role === "assistant"
                        ? "max-w-[42rem]"
                        : "max-w-[32rem]"
                    } ${
                      message.role === "assistant"
                        ? "border-white/10 bg-white/5 text-slate-100"
                        : "border-cyan-300/25 bg-cyan-400/10 text-cyan-50"
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                      {message.role === "assistant" ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span>{message.role}</span>
                      {message.blocked ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-1 text-[10px] text-amber-100">
                          blocked by app guardrail
                        </span>
                      ) : null}
                      {message.leaked ? (
                        <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">
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
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    Sending this run to the live OpenAI demo backend...
                  </div>
                </div>
              ) : null}
            </div>
            <div className="space-y-4">
              <Textarea
                className="min-h-32 border-white/10 bg-slate-900/80 text-base text-slate-50"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Use the recommended prompt for the selected scenario or type your own."
                value={draft}
              />
              <div className="flex flex-wrap gap-3">
                <Button className="min-w-40" onClick={handleSend}>
                  Run This Mode
                </Button>
                <Button
                  className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={() => setDraft(currentScenario.recommendedPrompt)}
                  variant="outline"
                >
                  Load Prompt
                </Button>
                <Button
                  className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={() => resetDemo(currentScenario.recommendedPrompt)}
                  variant="outline"
                >
                  Reset Demo
                </Button>
              </div>
              {apiError ? (
                <p className="text-sm leading-6 text-amber-200">
                  Live API issue: {apiError}
                </p>
              ) : (
                <p className="text-sm leading-6 text-slate-400">
                  This panel calls <code>{DEFAULT_API_BASE_URL}/demo/chat</code> with
                  the selected mode and scenario.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-6">
        <section className="space-y-4" id="mode-switch">
          <Card className="border-white/10 bg-slate-950/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
                <CardTitle className="text-xl text-white">Mode Switch</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Compare the same OpenAI backend under different application behaviors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_MODES.map((mode) => (
                <button
                  key={mode.id}
                  className={`grid min-h-[8.75rem] w-full grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-[1.25rem] border p-4 text-left transition ${
                    selectedMode === mode.id
                      ? "border-cyan-300/50 bg-cyan-400/10"
                      : "border-white/10 bg-white/[0.03] hover:border-cyan-300/30 hover:bg-cyan-400/5"
                  }`}
                  onClick={() => {
                    setSelectedMode(mode.id);
                    resetDemo(currentScenario.recommendedPrompt);
                  }}
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">{mode.label}</p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      {mode.description}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Badge className="min-w-[12rem] justify-center border-white/10 bg-white/5 text-slate-300">
                      {mode.shortLabel}
                    </Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </section>
        <section className="space-y-4" id="scenario-lab">
          <Card className="border-white/10 bg-slate-950/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldOff className="h-5 w-5 text-rose-300" />
                <CardTitle className="text-xl text-white">Scenario Lab</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Pick the attack surface you want to narrate live.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  className={`grid min-h-[8.5rem] w-full grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-[1.25rem] border p-4 text-left transition ${
                    selectedScenario === scenario.id
                      ? "border-rose-300/40 bg-rose-500/10"
                      : "border-white/10 bg-white/[0.03] hover:border-rose-300/30 hover:bg-rose-500/[0.06]"
                  }`}
                  onClick={() => {
                    setSelectedScenario(scenario.id);
                    resetDemo(scenario.recommendedPrompt);
                  }}
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">{scenario.label}</p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      {scenario.description}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Badge className="min-w-[7.5rem] justify-center border-white/10 bg-white/5 text-slate-300">
                      {scenario.surface}
                    </Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </section>
        <section className="space-y-4" id="context-preview">
          <Card className="border-rose-400/20 bg-rose-500/[0.06]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-200" />
                <CardTitle className="text-xl text-white">
                  {currentScenario.assetLabel}
                </CardTitle>
              </div>
              <CardDescription className="text-rose-100/75">
                This is the app-side content the vulnerable and guarded modes reason
                over.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-[1.25rem] border border-rose-300/20 bg-slate-950/60 p-4 text-sm leading-7 text-rose-100">
                {currentScenario.assetPreview}
              </pre>
            </CardContent>
          </Card>
        </section>
        <section className="space-y-4" id="observability">
          <Card className="border-white/10 bg-slate-950/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-cyan-300" />
                <CardTitle className="text-xl text-white">Observability</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Latest run only. Watch where the provider stops and where the app takes over.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* TODO(Session 3): Expand this into a small run history or anomaly
              dashboard so the observability section maps more closely to the
              final 5-layer architecture story. */}
              {logs.map((log, index) => (
                <div
                  key={`${log.stage}-${index}`}
                  className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                      {log.stage}
                    </p>
                    <p className="text-sm font-medium text-white">{log.decision}</p>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Risk score
                      </p>
                      <p className="text-3xl font-semibold text-white">
                        {log.riskScore.toFixed(2)}
                      </p>
                    </div>
                    {log.riskScore >= 0.8 ? (
                      <Badge className="border-rose-400/40 bg-rose-500/15 text-rose-100">
                        critical
                      </Badge>
                    ) : log.riskScore >= 0.4 ? (
                      <Badge className="border-amber-300/40 bg-amber-400/15 text-amber-100">
                        elevated
                      </Badge>
                    ) : (
                      <Badge className="border-emerald-300/40 bg-emerald-400/15 text-emerald-100">
                        low
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {log.reason}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
        <section className="space-y-4" id="why-guardrails">
          <Card className="border-emerald-300/20 bg-emerald-400/[0.07]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-200" />
                <CardTitle className="text-xl text-white">
                  Why Guardrails Still Matter
                </CardTitle>
              </div>
              <CardDescription className="text-emerald-100/75">
                The current mode’s teaching point for your narration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO(Session 3): Add the visible 5-layer architecture diagram
              here or directly below this card so the close of the demo lands on
              the full guardrail stack instead of text only. */}
              <p className="text-sm leading-7 text-emerald-50">
                {currentMode.takeaway}
              </p>
            </CardContent>
          </Card>
        </section>
      </aside>
    </div>
  );
}
