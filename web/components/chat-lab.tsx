"use client";

import { AlertTriangle, Bot, ChevronRight, ClipboardList, ShieldOff } from "lucide-react";
import { useState } from "react";
import { ATTACK_PRESETS, DEFAULT_LOGS, DEMO_SYSTEM_PROMPT, INITIAL_MESSAGES, evaluatePromptRisk, generateVulnerableReply, type ChatMessage, type GuardrailLog } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function ChatLab() {
  const [draft, setDraft] = useState(ATTACK_PRESETS[0].prompt);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [logs, setLogs] = useState<GuardrailLog[]>(DEFAULT_LOGS);
  const [isResponding, setIsResponding] = useState(false);

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
    const risk = evaluatePromptRisk(prompt);
    const inputLog: GuardrailLog = {
      id: crypto.randomUUID(),
      stage: "input",
      decision: "allowed",
      riskScore: risk.score,
      reason: risk.reason
    };

    setMessages((current) => [...current, userMessage]);
    setLogs((current) => [inputLog, ...current]);
    setDraft("");
    setIsResponding(true);

    await new Promise((resolve) => setTimeout(resolve, 700));

    const reply = generateVulnerableReply(prompt);
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: reply.content,
      leaked: reply.leaked
    };
    const outputLog: GuardrailLog = {
      id: crypto.randomUUID(),
      stage: "output",
      decision: "released",
      riskScore: reply.outputRisk,
      reason: reply.outputReason
    };

    setMessages((current) => [...current, assistantMessage]);
    setLogs((current) => [outputLog, ...current]);
    setIsResponding(false);
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[1.25fr_0.75fr]">
      <section className="space-y-6" id="playground">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="border-rose-400/40 bg-rose-500/15 text-rose-200">
            Vulnerable Mode
          </Badge>
          <Badge className="border-amber-300/40 bg-amber-400/15 text-amber-100">
            Fake prompt leakage enabled
          </Badge>
          <Badge className="border-cyan-300/40 bg-cyan-400/15 text-cyan-100">
            Mocked LLM for reliable demos
          </Badge>
        </div>
        <Card className="overflow-hidden border-white/10 bg-slate-950/60">
          <CardHeader className="border-b border-white/10 bg-white/[0.03]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl text-white">
                  Workspace Assistant
                </CardTitle>
                <CardDescription className="text-slate-400">
                  A deliberately unsafe assistant that obeys hostile prompts.
                </CardDescription>
              </div>
              <div className="rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
                No Guardrails Active
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-6">
            <div className="max-h-[28rem] space-y-4 overflow-y-auto rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[1.25rem] border px-4 py-3 ${
                      message.role === "assistant"
                        ? "border-white/10 bg-white/5 text-slate-100"
                        : "border-cyan-300/25 bg-cyan-400/10 text-cyan-50"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                      {message.role === "assistant" ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span>{message.role}</span>
                      {message.leaked ? (
                        <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">
                          leaked sensitive data
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
                    Simulating a reckless model response...
                  </div>
                </div>
              ) : null}
            </div>
            <div className="space-y-4">
              <Textarea
                className="min-h-32 border-white/10 bg-slate-900/80 text-base text-slate-50"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type a hostile prompt or choose a preset attack..."
                value={draft}
              />
              <div className="flex flex-wrap gap-3">
                <Button className="min-w-40" onClick={handleSend}>
                  Break The Bot
                </Button>
                <Button
                  className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={() => {
                    setMessages(INITIAL_MESSAGES);
                    setLogs(DEFAULT_LOGS);
                    setDraft(ATTACK_PRESETS[0].prompt);
                  }}
                  variant="outline"
                >
                  Reset Demo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-6">
        <section className="space-y-4" id="attack-library">
          <Card className="border-white/10 bg-slate-950/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldOff className="h-5 w-5 text-rose-300" />
                <CardTitle className="text-xl text-white">Attack Library</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Use these live on camera to show different prompt-injection paths.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ATTACK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className="w-full rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
                  onClick={() => setDraft(preset.prompt)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{preset.label}</p>
                    <Badge className="border-white/10 bg-white/5 text-slate-300">
                      {preset.surface}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {preset.description}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        </section>
        <section className="space-y-4">
          <Card className="border-white/10 bg-slate-950/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-cyan-300" />
                <CardTitle className="text-xl text-white">Observability</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                High-risk interactions are visible, but the app still ships them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                      {log.stage}
                    </p>
                    <p className="text-sm font-medium text-white">
                      {log.decision}
                    </p>
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
                    ) : (
                      <Badge className="border-amber-300/40 bg-amber-400/15 text-amber-100">
                        monitored
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
        <section className="space-y-4" id="why-it-breaks">
          <Card className="border-rose-400/20 bg-rose-500/[0.06]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-200" />
                <CardTitle className="text-xl text-white">Why It Breaks</CardTitle>
              </div>
              <CardDescription className="text-rose-100/75">
                This is the fake hidden instruction block the attacker should never reach.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-[1.25rem] border border-rose-300/20 bg-slate-950/60 p-4 text-sm leading-7 text-rose-100">
                {DEMO_SYSTEM_PROMPT}
              </pre>
            </CardContent>
          </Card>
        </section>
      </aside>
    </div>
  );
}
