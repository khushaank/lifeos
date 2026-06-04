"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Lock,
  PhoneOff,
  Layers,
  BatteryLow,
  Bolt,
  X,
  Rocket,
  Search,
  Flame,
  User,
  Hourglass,
  Check,
  Eye,
  Droplet,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Radar,
  ListTodo,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define the states matching user data, mapping Lucide icons
interface ProcrastinationState {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  colorClass: string; // text color
  borderClass: string; // border color
  bgColorClass: string; // background color
  p: string[]; // Protocol steps
}

const STATES: ProcrastinationState[] = [
  {
    id: "frozen",
    icon: Lock,
    label: "Frozen",
    desc: "Brain locked. Can't initiate anything.",
    colorClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-500",
    bgColorClass: "bg-blue-50/50 dark:bg-blue-950/20",
    p: [
      "Close everything except one work tab",
      "Write the task in exactly 5 words",
      "Set only a 10-minute timer",
      "Open the file, document, or tool",
      "Type one word or sentence — move now",
    ],
  },
  {
    id: "distracted",
    icon: PhoneOff,
    label: "Distracted",
    desc: "Starting but can't stay locked in.",
    colorClass: "text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-500",
    bgColorClass: "bg-amber-50/50 dark:bg-amber-950/20",
    p: [
      "Phone face-down in another room — now",
      "Close all non-work browser tabs",
      "Write your task name on paper",
      "Headphones on: lo-fi or white noise",
      "Work until the timer rings. Nothing else.",
    ],
  },
  {
    id: "overwhelmed",
    icon: Layers,
    label: "Overwhelmed",
    desc: "Too much. Don't know where to begin.",
    colorClass: "text-rose-600 dark:text-rose-400",
    borderClass: "border-rose-500",
    bgColorClass: "bg-rose-50/50 dark:bg-rose-950/20",
    p: [
      "Pick one task. Ignore everything else.",
      "Break it into only 3 micro-steps",
      "Focus on step 1 only, right now",
      "20 minutes — nothing else exists",
      "Ship step 1. Reassess after.",
    ],
  },
  {
    id: "low",
    icon: BatteryLow,
    label: "Low energy",
    desc: "Motivation is zero. Too tired to care.",
    colorClass: "text-slate-600 dark:text-slate-400",
    borderClass: "border-slate-400",
    bgColorClass: "bg-slate-50/50 dark:bg-slate-900/20",
    p: [
      "Splash cold water on your face",
      "Stand up and walk for 2 minutes",
      "Pick your lightest, easiest task",
      "Give yourself permission to do it badly",
      "15-minute sprint only, then actual rest",
    ],
  },
];

interface Law {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  t: string;
  b: string;
}

const LAWS: Law[] = [
  { id: 1, icon: Bolt, t: "2-minute rule", b: "If it takes under 2 minutes, do it right now. Zero scheduling allowed." },
  { id: 2, icon: X, t: "Kill the tab", b: "Every open tab is an open wound. Close everything not directly related to your task." },
  { id: 3, icon: Rocket, t: "5-4-3-2-1 launch", b: "Count down from 5 then physically move. Bypasses your brain's resistance reflex completely." },
  { id: 4, icon: Search, t: "Shrink the task", b: '"Write the report" → "open the doc and type one word." Embarrassingly small beats not started.' },
  { id: 5, icon: Flame, t: "No perfect start", b: "A bad start beats no start. Imperfect action creates momentum. Start ugly, fix it later." },
  { id: 6, icon: User, t: "Identity first", b: "You're not trying to work. You are someone who starts immediately. Embody it, then act." },
  { id: 7, icon: Hourglass, t: "Sealed sprints", b: "Work in sealed time blocks — 25 to 45 minutes. One task. Phone elsewhere. No exceptions." },
  { id: 8, icon: Check, t: "Done over perfect", b: "Shipped mediocre beats never-finished perfect. Every single time, without exception." },
  { id: 9, icon: Eye, t: "Future self deal", b: "Your future self will either thank or curse present you. Make that decision consciously, now." },
  { id: 10, icon: Droplet, t: "Body starts brain", b: "Stand up, drink water, take 10 deep breaths. Physical movement directly resets mental state." },
];

const DURS = [
  { l: "15 min", s: 900 },
  { l: "25 min", s: 1500 },
  { l: "45 min", s: 2700 },
];

export function AntiProcrastination() {
  const [activeTab, setActiveTab] = useState<"home" | "diagnose" | "protocol" | "sprint" | "laws">("home");
  const [selState, setSelState] = useState<ProcrastinationState | null>(null);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [task, setTask] = useState("");
  const [durIdx, setDurIdx] = useState(1);
  const [timerSecs, setTimerSecs] = useState(1500);
  const [running, setRunning] = useState(false);
  const [lawIdx, setLawIdx] = useState(0);
  const [checkedLaws, setCheckedLaws] = useState<number[]>([]);

  // Count down activation state
  const [isActivating, setIsActivating] = useState(false);
  const [countdownNum, setCountdownNum] = useState(3);

  const tInt = useRef<NodeJS.Timeout | null>(null);
  const lInt = useRef<NodeJS.Timeout | null>(null);

  // Sync timer with durIdx if not running
  useEffect(() => {
    if (!running) {
      setTimerSecs(DURS[durIdx].s);
    }
  }, [durIdx, running]);

  // Handle countdown interval
  useEffect(() => {
    if (running) {
      tInt.current = setInterval(() => {
        setTimerSecs((prev) => {
          if (prev <= 1) {
            setRunning(false);
            if (tInt.current) clearInterval(tInt.current);
            if (lInt.current) clearInterval(lInt.current);
            // Trigger desktop notification if available
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("Focus Sprint Completed!", {
                body: task ? `Great job working on: "${task}"` : "Awesome sprint, take a break!",
                icon: "/favicon.ico",
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Cycle laws every 45 seconds
      lInt.current = setInterval(() => {
        setLawIdx((prev) => (prev + 1) % LAWS.length);
      }, 45000);
    } else {
      if (tInt.current) clearInterval(tInt.current);
      if (lInt.current) clearInterval(lInt.current);
    }

    return () => {
      if (tInt.current) clearInterval(tInt.current);
      if (lInt.current) clearInterval(lInt.current);
    };
  }, [running, task]);

  const handleActivate = () => {
    setIsActivating(true);
    setCountdownNum(3);
    
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setIsActivating(false);
        setActiveTab("diagnose");
      } else {
        setCountdownNum(count);
      }
    }, 650);
  };

  const handleSelectState = (stateId: string) => {
    const found = STATES.find((s) => s.id === stateId);
    if (found) {
      setSelState(found);
      setDoneSteps([]);
      setActiveTab("protocol");
    }
  };

  const toggleStep = (idx: number) => {
    setDoneSteps((prev) =>
      prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
    );
  };

  const handleLaunchSprint = () => {
    setTimerSecs(DURS[durIdx].s);
    setRunning(true);
    setActiveTab("sprint");
  };

  const toggleLaw = (id: number) => {
    setCheckedLaws((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const fmtTime = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, "0");
    const secs = (s % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const progressPct = ((DURS[durIdx].s - timerSecs) / DURS[durIdx].s) * 100;
  const ActiveLawIcon = LAWS[lawIdx].icon;

  return (
    <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-card text-card-foreground">
      {/* Sub-nav Tab Bar */}
      <div className="flex border-b border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-4 py-2 gap-1.5 scrollbar-none overflow-x-auto">
        {(["home", "diagnose", "sprint", "laws"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
              (activeTab === tab || (tab === "diagnose" && activeTab === "protocol"))
                ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/50 dark:border-slate-700/80 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            )}
          >
            {tab === "home" ? "Home" : tab === "diagnose" ? "Diagnose" : tab === "sprint" ? "Sprint Timer" : "10 Laws"}
          </button>
        ))}
      </div>

      <CardContent className="p-6">
        {/* HOME SCREEN */}
        {activeTab === "home" && (
          <div className="space-y-6">
            {isActivating ? (
              <div className="text-center py-16 space-y-4">
                <div className="text-8xl font-black font-mono text-teal-600 dark:text-teal-400 animate-pulse tracking-tight">
                  {countdownNum}
                </div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Activating System...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Bolt className="h-5 w-5 text-teal-500 fill-current" />
                    Anti-Procrastination System
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    You&apos;re here because you&apos;re not working. That&apos;s the first honest step.
                    The system gives you a protocol — the protocol gives you momentum.
                  </p>
                </div>

                <Button
                  onClick={handleActivate}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold h-12 text-sm rounded-xl cursor-pointer shadow-md shadow-teal-500/10 flex items-center justify-center gap-2"
                >
                  <Bolt className="h-4 w-4 fill-current" /> Activate Now
                </Button>

                {/* Grid of screens */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab("diagnose")}
                    className="flex flex-col items-center justify-center p-4 border border-slate-200/60 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 hover:bg-teal-50/40 dark:hover:bg-teal-950/10 hover:border-teal-300 dark:hover:border-teal-900 transition-all cursor-pointer gap-2"
                  >
                    <Radar className="h-5 w-5 text-teal-500" />
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Diagnose
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("sprint")}
                    className="flex flex-col items-center justify-center p-4 border border-slate-200/60 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 hover:bg-teal-50/40 dark:hover:bg-teal-950/10 hover:border-teal-300 dark:hover:border-teal-900 transition-all cursor-pointer gap-2"
                  >
                    <Play className="h-5 w-5 text-teal-500" />
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Sprint
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("laws")}
                    className="flex flex-col items-center justify-center p-4 border border-slate-200/60 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 hover:bg-teal-50/40 dark:hover:bg-teal-950/10 hover:border-teal-300 dark:hover:border-teal-900 transition-all cursor-pointer gap-2"
                  >
                    <ListTodo className="h-5 w-5 text-teal-500" />
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      10 Laws
                    </span>
                  </button>
                </div>

                {/* Reminder Box */}
                <div className="p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-900/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Sparkles className="h-20 w-20 text-slate-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Remember</p>
                  <p className="text-sm mt-1.5 leading-relaxed text-slate-700 dark:text-slate-350 italic">
                    &ldquo;You don&apos;t have to feel like working. You just have to start. The feeling follows action — never the other way around.&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DIAGNOSE SCREEN */}
        {activeTab === "diagnose" && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-black">What&apos;s stopping you?</h3>
              <p className="text-xs text-slate-500">Pick your current mental state to get a tailored action protocol.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {STATES.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectState(s.id)}
                    className={cn(
                      "p-4 border-l-4 text-left rounded-xl border border-slate-200/80 bg-white shadow-sm hover:bg-slate-50/50 hover:shadow dark:border-slate-800 dark:bg-slate-950/20 dark:hover:bg-slate-900/30 transition-all cursor-pointer flex gap-3.5 items-start",
                      s.borderClass
                    )}
                  >
                    <div className={cn("p-2 rounded-xl shrink-0", s.bgColorClass)}>
                      <Icon className={cn("h-5 w-5", s.colorClass)} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white">{s.label}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PROTOCOL VIEW */}
        {activeTab === "protocol" && selState && (
          <div className="space-y-5">
            <button
              onClick={() => setActiveTab("diagnose")}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-850 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to states
            </button>

            {/* State Banner */}
            <div className={cn("p-4 rounded-xl border border-l-4 flex items-center gap-3.5", selState.borderClass, selState.bgColorClass)}>
              {(() => {
                const Icon = selState.icon;
                return <Icon className={cn("h-6 w-6 shrink-0", selState.colorClass)} />;
              })()}
              <div>
                <h4 className="font-black text-sm">{selState.label} Protocol</h4>
                <p className="text-xs text-slate-500 mt-0.5">{selState.desc}</p>
              </div>
            </div>

            {/* Task input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Your target task (optional)</Label>
              <Input
                placeholder="What are you supposed to be doing?"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="bg-slate-50 border-slate-200 focus:border-teal-500 text-sm h-10"
              />
            </div>

            {/* Checklist steps */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Execute in order — tap to check off:</Label>
              <div className="space-y-1.5">
                {selState.p.map((step, idx) => {
                  const isChecked = doneSteps.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      className={cn(
                        "w-full p-3 border rounded-xl flex items-start gap-3 text-left transition-all cursor-pointer bg-white dark:bg-slate-950/10",
                        isChecked
                          ? "border-teal-200 bg-teal-50/20 opacity-55 dark:border-teal-900/30"
                          : "border-slate-200/80 hover:bg-slate-50/50 dark:border-slate-800"
                      )}
                    >
                      <div
                        className={cn(
                          "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                          isChecked
                            ? "bg-teal-500 border-teal-500 text-white"
                            : "border-slate-300 bg-slate-50"
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 mr-2 uppercase">{String(idx + 1).padStart(2, "0")}</span>
                        <span className={cn("text-xs font-semibold", isChecked && "line-through text-slate-400")}>
                          {step}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sprint duration:</Label>
              <div className="flex gap-2.5">
                {DURS.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDurIdx(idx)}
                    className={cn(
                      "flex-1 py-2.5 border rounded-xl text-xs font-bold transition-all cursor-pointer",
                      durIdx === idx
                        ? "bg-teal-50 text-teal-700 border-teal-500 shadow-sm font-black dark:bg-teal-950/30"
                        : "border-slate-200/80 text-slate-500 hover:bg-slate-50/50 dark:border-slate-800"
                    )}
                  >
                    {d.l}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleLaunchSprint}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold h-12 text-sm rounded-xl cursor-pointer shadow-md shadow-teal-500/10 flex items-center justify-center gap-2 mt-2"
            >
              <Play className="h-4 w-4 mr-1 fill-current" /> Launch Focus Sprint
            </Button>
          </div>
        )}

        {/* SPRINT TIMER */}
        {activeTab === "sprint" && (
          <div className="space-y-5">
            {/* Task bar */}
            {task ? (
              <div className="p-3 border-l-4 border-teal-500 bg-slate-50 dark:bg-slate-900/30 rounded-r-xl border border-slate-200/60 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Focus Target</p>
                <p className="text-xs font-bold mt-0.5 text-slate-700 dark:text-slate-350">{task}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Set sprint focus topic:</Label>
                <Input
                  placeholder="Enter what you're working on..."
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-sm h-10"
                />
              </div>
            )}

            {/* Countdown display */}
            <div className="text-center py-6">
              <div
                className={cn(
                  "font-mono text-6xl sm:text-7xl font-bold tracking-widest tabular-nums leading-none",
                  timerSecs === 0
                    ? "text-rose-600 dark:text-rose-400"
                    : running
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-slate-800 dark:text-slate-200"
                )}
              >
                {fmtTime(timerSecs)}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                {timerSecs === 0
                  ? "Sprint Complete! ✓"
                  : running
                    ? "Sprint active — stay locked in"
                    : "Ready to start"}
              </p>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Duration Selector (when not running) */}
            {!running && (
              <div className="flex gap-2">
                {DURS.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDurIdx(idx)}
                    className={cn(
                      "flex-1 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer",
                      durIdx === idx
                        ? "bg-teal-50 text-teal-700 border-teal-500 dark:bg-teal-950/20"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {d.l}
                  </button>
                ))}
              </div>
            )}

            {/* Play controls */}
            <div className="flex gap-3">
              {!running ? (
                <Button
                  onClick={() => setRunning(true)}
                  disabled={timerSecs === 0}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold h-11 rounded-xl cursor-pointer"
                >
                  <Play className="h-4 w-4 mr-2 fill-current" /> Start
                </Button>
              ) : (
                <Button
                  onClick={() => setRunning(false)}
                  variant="outline"
                  className="flex-1 border-slate-200 hover:bg-slate-50 cursor-pointer h-11 rounded-xl"
                >
                  <Pause className="h-4 w-4 mr-2" /> Pause
                </Button>
              )}
              <Button
                onClick={() => {
                  setRunning(false);
                  setTimerSecs(DURS[durIdx].s);
                }}
                variant="outline"
                className="border-slate-200 hover:bg-slate-50 cursor-pointer h-11 rounded-xl"
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>

            {/* Active Law cycling display */}
            <div className="p-4 border border-teal-200/50 bg-teal-50/10 dark:border-teal-900/30 rounded-2xl relative overflow-hidden flex gap-3.5">
              <div className="p-2.5 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl shrink-0 self-start">
                <ActiveLawIcon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Active Law</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    {String(LAWS[lawIdx].id).padStart(2, "0")} / 10
                  </span>
                </div>
                <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">{LAWS[lawIdx].t}</h5>
                <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">{LAWS[lawIdx].b}</p>
              </div>
            </div>
          </div>
        )}

        {/* 10 LAWS LIST */}
        {activeTab === "laws" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black">The 10 Laws of Focus</h3>
                <p className="text-xs text-slate-500 mt-0.5">Toggle the rules you are actively applying right now.</p>
              </div>
              <span className="text-xs font-bold bg-teal-50/60 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-lg border border-teal-200/40 dark:border-teal-900/40">
                {checkedLaws.length} / 10 today
              </span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {LAWS.map((l) => {
                const Icon = l.icon;
                const isChecked = checkedLaws.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLaw(l.id)}
                    className={cn(
                      "w-full p-3.5 border rounded-xl flex gap-3 text-left transition-all cursor-pointer items-start bg-white dark:bg-slate-950/10",
                      isChecked
                        ? "border-teal-200 bg-teal-50/20 dark:border-teal-950/20"
                        : "border-slate-200/80 hover:bg-slate-50/50 dark:border-slate-800"
                    )}
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                        isChecked
                          ? "bg-teal-500 border-teal-500 text-white"
                          : "border-slate-300 bg-slate-50"
                      )}
                    >
                      {isChecked && <Check className="h-3 w-3" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", isChecked ? "text-teal-600 dark:text-teal-400" : "text-slate-400")} />
                          <span className={cn("font-bold text-xs", isChecked ? "text-teal-700 dark:text-teal-400" : "text-slate-850")}>
                            {l.t}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-400">
                          {String(l.id).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {l.b}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
