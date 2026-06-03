"use client";

import { Navigation } from "@/components/navigation";
import { useLifeStore } from "@/store/useLifeStore";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

const rules = [
  {
    number: "01",
    title: "Win. Always.",
    body: "Second place is just the first loser. Every room, every deal, every conversation — you walk out on top, or you weren't trying hard enough.",
  },
  {
    number: "02",
    title: "Attack back.",
    body: "When someone comes at you, don't defend. Counter. Hard. The moment you get defensive, you've already told them they have power over you.",
  },
  {
    number: "03",
    title: "Never show weakness.",
    body: "Everyone has doubt. Smart people never let it show. Your face is a weapon — use it like one.",
  },
  {
    number: "04",
    title: "Know your leverage.",
    body: "Before you walk into any room, know what they need from you. That's the only number that matters.",
  },
  {
    number: "05",
    title: "You always have a move.",
    body: "Backed against the wall? Break the goddamn wall down. There is always something left to do. Paralysis is a choice.",
  },
  {
    number: "06",
    title: "Loyalty is earned.",
    body: "Give it completely to those who deserve it. Cut the rest without guilt. Loyalty to the wrong people is just slow suicide.",
  },
  {
    number: "07",
    title: "Image is power.",
    body: "The suit. The posture. The eye contact. Everything you wear and do says something. Make sure it says 'I'm the one in charge.'",
  },
  {
    number: "08",
    title: "Work harder than everyone.",
    body: "While they're sleeping, you're working. While they're celebrating, you're strategizing. Talent is common. Relentless execution is rare.",
  },
  {
    number: "09",
    title: "Never let them see you sweat.",
    body: "You can bleed, but not in public. Control the narrative. Control your face. Control the room.",
  },
  {
    number: "10",
    title: "Play the long game.",
    body: "Amateurs react. Professionals position. Think three steps ahead, always. Today's loss is tomorrow's leverage.",
  },
  {
    number: "11",
    title: "Be the exception.",
    body: "Rules exist for people who can't think for themselves. Know when to bend them, when to break them, and when to write your own.",
  },
  {
    number: "12",
    title: "Close the deal.",
    body: "Talk is cheap. Execution is expensive. Anyone can have a meeting — only closers walk out with what they came for.",
  },
];

export default function WWHDPage() {
  const isSidebarCollapsed = useLifeStore((state) => state.isSidebarCollapsed);

  return (
    <div
      className={cn(
        "min-h-screen bg-slate-950 font-sans pb-24 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
      )}
    >
      <Navigation />

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white shadow-2xl">
          {/* Ambient glow */}
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-rose-500/8 blur-3xl" />

          <div className="relative z-10 px-6 py-10 md:px-10 md:py-14 flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/25 backdrop-blur-sm shadow-lg shadow-amber-500/10">
              <Flame className="h-8 w-8 text-amber-400 fill-current" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent">
                WWHD
              </h1>
              <p className="text-lg md:text-xl font-medium text-slate-400">
                What Would Harvey Do?
              </p>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                The rules that separate the exceptional from the average. Read them. Live them. Win.
              </p>
            </div>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {rules.map((rule, index) => (
            <div
              key={rule.number}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-950 p-5 md:p-6 transition-all duration-300 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5",
                index === 0 && "md:col-span-2"
              )}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex gap-4">
                {/* Number badge */}
                <div className="flex-shrink-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-sm tracking-wide">
                    {rule.number}
                  </span>
                </div>

                <div className="space-y-2 min-w-0">
                  <h2 className="text-base md:text-lg font-bold text-white group-hover:text-amber-100 transition-colors">
                    {rule.title}
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                    {rule.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom motivational CTA */}
        <div className="text-center py-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-500/60">
            Now go win.
          </p>
        </div>
      </main>
    </div>
  );
}
