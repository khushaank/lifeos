"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { useLifeStore } from "@/store/useLifeStore";
import { useSyncLifeData } from "@/hooks/use-sync-life-data";
import { useExperimentNotifications } from "@/hooks/use-experiment-notifications";
import { EXPERIMENT_TEMPLATES, EXPERIMENT_DURATION_DAYS } from "@/lib/experiment-catalog";
import { experimentProgress, todayString } from "@/lib/experiments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Store,
  Download,
  Bell,
  Check,
  X,
  Trash2,
  Video,
  BookOpen,
  Dumbbell,
  Sparkles,
} from "lucide-react";

const TRACK_ICONS = {
  youtube: Video,
  study: BookOpen,
  workout: Dumbbell,
  reading: BookOpen,
  custom: Sparkles,
};

export default function ExperimentsPage() {
  const experiments = useLifeStore((s) => s.experiments);
  const installExperiment = useLifeStore((s) => s.installExperiment);
  const recordExperimentResponse = useLifeStore((s) => s.recordExperimentResponse);
  const updateExperiment = useLifeStore((s) => s.updateExperiment);
  const removeExperiment = useLifeStore((s) => s.removeExperiment);

  useSyncLifeData();
  const { requestPermission } = useExperimentNotifications();

  const [installId, setInstallId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [notifyHour, setNotifyHour] = useState(20);
  const [notifyOn, setNotifyOn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  const today = todayString();
  const installedTemplateIds = new Set(experiments.map((e) => e.template_id));

  const activeWithProgress = useMemo(
    () =>
      experiments.map((exp) => ({
        exp,
        prog: experimentProgress(exp),
      })),
    [experiments]
  );

  const handleInstall = async (templateId: string) => {
    setBusy(true);
    setInstallError(null);
    const isCustom = templateId === "custom-90";
    const ok = await installExperiment({
      templateId,
      title: isCustom ? customTitle : undefined,
      dailyPrompt: isCustom ? customPrompt : undefined,
      notifyEnabled: notifyOn,
      notifyHour,
    });
    setBusy(false);
    if (ok) {
      setInstallId(null);
      setCustomTitle("");
      setCustomPrompt("");
      if (notifyOn) await requestPermission();
    } else {
      setInstallError(
        "Could not install. Run supabase/fix_rls_and_tables.sql in your Supabase SQL Editor, then try again."
      );
    }
  };

  return (
    <PageShell maxWidth="5xl" mainClassName="space-y-8">
      <div className="hidden">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
            <Store className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Life experiments</h1>
            <p className="text-sm text-muted-foreground">
              Install a 90-day challenge from the store. It auto-expires when done — daily nudges included.
            </p>
          </div>
        </div>
      </div>

      {activeWithProgress.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-bold px-1">Active challenges</h2>
          {activeWithProgress.map(({ exp, prog }) => {
            const Icon = TRACK_ICONS[exp.track_type] || Sparkles;
            const todayAnswer = exp.responses[today];
            return (
              <Card key={exp.id} className="rounded-2xl border-teal-200 dark:border-teal-900/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{exp.title}</CardTitle>
                        <CardDescription className="text-xs">
                          Day {prog.elapsed} of {prog.totalDays} · {prog.daysLeft} days left ·{" "}
                          {prog.adherence}% adherence
                        </CardDescription>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExperiment(exp.id)}
                      className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 flex items-center justify-center cursor-pointer"
                      title="End challenge early"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${prog.pctTime}%` }}
                    />
                  </div>

                  <div className="rounded-xl bg-muted/40 border border-border p-4">
                    <p className="text-sm font-semibold mb-3">{exp.daily_prompt}</p>
                    {todayAnswer === undefined ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-teal-500 hover:bg-teal-600 text-white cursor-pointer"
                          onClick={() => recordExperimentResponse(exp.id, today, true)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Yes, done
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 cursor-pointer"
                          onClick={() => recordExperimentResponse(exp.id, today, false)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Not today
                        </Button>
                      </div>
                    ) : (
                      <p
                        className={cn(
                          "text-sm font-medium",
                          todayAnswer ? "text-emerald-600" : "text-muted-foreground"
                        )}
                      >
                        {todayAnswer ? "Logged for today — great work." : "Marked as skipped for today."}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Bell className="h-3.5 w-3.5" />
                      <Switch
                        checked={exp.notify_enabled}
                        onCheckedChange={(v) => updateExperiment(exp.id, { notify_enabled: v })}
                      />
                      Daily reminder
                    </label>
                    <label className="flex items-center gap-2">
                      Hour:
                      <select
                        value={exp.notify_hour}
                        onChange={(e) =>
                          updateExperiment(exp.id, { notify_hour: parseInt(e.target.value, 10) })
                        }
                        className="h-8 rounded border border-border bg-background px-2"
                      >
                        {Array.from({ length: 24 }, (_, h) => (
                          <option key={h} value={h}>
                            {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span>
                      {prog.doneCount} yes · {prog.missedCount} no
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      {installError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          {installError}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-base font-bold px-1">Marketplace</h2>
        <p className="text-xs text-muted-foreground px-1">
          Pick a challenge to install for {EXPERIMENT_DURATION_DAYS} days. After that it disappears from active
          list.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPERIMENT_TEMPLATES.map((tpl) => {
            const installed = installedTemplateIds.has(tpl.id);
            const isInstalling = installId === tpl.id;
            const Icon = TRACK_ICONS[tpl.trackType];
            return (
              <Card key={tpl.id} className="rounded-2xl overflow-hidden">
                <div className={cn("h-1.5 w-full", tpl.accent)} />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{tpl.name}</CardTitle>
                      <CardDescription className="text-[10px] uppercase tracking-wide">
                        {tpl.category} · {tpl.durationDays} days
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>
                  <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-2">
                    &ldquo;{tpl.dailyPrompt}&rdquo;
                  </p>

                  {isInstalling && tpl.id === "custom-90" && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div>
                        <Label className="text-xs">Challenge name</Label>
                        <Input
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="e.g. No sugar"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Daily question</Label>
                        <Textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          rows={2}
                          placeholder="Did you avoid sugar today?"
                        />
                      </div>
                    </div>
                  )}

                  {isInstalling && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border text-xs">
                      <label className="flex items-center gap-2">
                        <Switch checked={notifyOn} onCheckedChange={setNotifyOn} />
                        Remind me daily
                      </label>
                      <label className="flex items-center gap-2">
                        At
                        <select
                          value={notifyHour}
                          onChange={(e) => setNotifyHour(parseInt(e.target.value, 10))}
                          className="h-8 rounded border border-border px-2"
                        >
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={h} value={h}>
                              {h}:00
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}

                  {installed ? (
                    <Button disabled variant="secondary" size="sm" className="w-full">
                      Installed
                    </Button>
                  ) : isInstalling ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-teal-500 hover:bg-teal-600 text-white cursor-pointer"
                        disabled={busy || (tpl.id === "custom-90" && (!customTitle || !customPrompt))}
                        onClick={() => handleInstall(tpl.id)}
                      >
                        Confirm install
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setInstallId(null)} className="cursor-pointer">
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full cursor-pointer"
                      onClick={() => setInstallId(tpl.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Install challenge
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
