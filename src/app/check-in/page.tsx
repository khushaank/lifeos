"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLifeStore } from "@/store/useLifeStore";
import { calculateLifeScore } from "@/lib/formulas";
import { DEFAULT_CHECK_IN_FORM, entryToCheckInForm } from "@/lib/check-in-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PageShell } from "@/components/page-shell";
import { Save, Smile, Moon, Brain, Flame, Trash2, Activity, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MOOD_LABELS = ["Terrible", "Bad", "Below Average", "Average", "Good", "Great", "Excellent", "Harvey"];
const MOOD_COLORS = ["text-rose-600", "text-orange-500", "text-amber-500", "text-yellow-500", "text-lime-500", "text-green-500", "text-emerald-500", "text-teal-600"];
const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😊", "😄", "🌟", "🔥"];

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function SliderField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-semibold">{label}</Label>
        <span className="text-sm font-bold bg-muted px-2 py-0.5 rounded-lg min-w-[40px] text-center">
          {value}/{max}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
          }}
        />
      </div>
    </div>
  );
}

function applyFormState(
  setters: {
    setMoodScore: (v: number) => void;
    setSleepHours: (v: number) => void;
    setSleepQuality: (v: number) => void;
    setEnergyLevel: (v: number) => void;
    setFocusLevel: (v: number) => void;
    setProductivityLevel: (v: number) => void;
    setStressLevel: (v: number) => void;
    setWaterIntake: (v: number) => void;
    setJunkFood: (v: boolean) => void;
    setSocialInteraction: (v: number) => void;
    setWorkoutDone: (v: boolean) => void;
    setExerciseDuration: (v: number) => void;
    setWorkoutType: (v: string) => void;
    setPagesRead: (v: number) => void;
    setBookName: (v: string) => void;
    setStudyHours: (v: number) => void;
    setStudyTopic: (v: string) => void;
    setNotes: (v: string) => void;
    setWins: (v: string) => void;
    setChallenges: (v: string) => void;
  },
  form: typeof DEFAULT_CHECK_IN_FORM
) {
  setters.setMoodScore(form.moodScore);
  setters.setSleepHours(form.sleepHours);
  setters.setSleepQuality(form.sleepQuality);
  setters.setEnergyLevel(form.energyLevel);
  setters.setFocusLevel(form.focusLevel);
  setters.setProductivityLevel(form.productivityLevel);
  setters.setStressLevel(form.stressLevel);
  setters.setWaterIntake(form.waterIntake);
  setters.setJunkFood(form.junkFood);
  setters.setSocialInteraction(form.socialInteraction);
  setters.setWorkoutDone(form.workoutDone);
  setters.setExerciseDuration(form.exerciseDuration);
  setters.setWorkoutType(form.workoutType);
  setters.setPagesRead(form.pagesRead);
  setters.setBookName(form.bookName);
  setters.setStudyHours(form.studyHours);
  setters.setStudyTopic(form.studyTopic);
  setters.setNotes(form.notes);
  setters.setWins(form.wins);
  setters.setChallenges(form.challenges);
}

export default function CheckInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addOrUpdateEntry = useLifeStore((state) => state.addOrUpdateEntry);
  const deleteEntry = useLifeStore((state) => state.deleteEntry);
  const entries = useLifeStore((state) => state.entries);
  const isSyncing = useLifeStore((state) => state.isSyncing);
  const initialDate = searchParams.get("date") || todayString();
  const [date, setDate] = useState(initialDate);
  const [moodScore, setMoodScore] = useState(DEFAULT_CHECK_IN_FORM.moodScore);
  const [sleepHours, setSleepHours] = useState(DEFAULT_CHECK_IN_FORM.sleepHours);
  const [sleepQuality, setSleepQuality] = useState(DEFAULT_CHECK_IN_FORM.sleepQuality);
  const [energyLevel, setEnergyLevel] = useState(DEFAULT_CHECK_IN_FORM.energyLevel);
  const [focusLevel, setFocusLevel] = useState(DEFAULT_CHECK_IN_FORM.focusLevel);
  const [productivityLevel, setProductivityLevel] = useState(DEFAULT_CHECK_IN_FORM.productivityLevel);
  const [stressLevel, setStressLevel] = useState(DEFAULT_CHECK_IN_FORM.stressLevel);
  const [waterIntake, setWaterIntake] = useState(DEFAULT_CHECK_IN_FORM.waterIntake);
  const [junkFood, setJunkFood] = useState(DEFAULT_CHECK_IN_FORM.junkFood);
  const [socialInteraction, setSocialInteraction] = useState(DEFAULT_CHECK_IN_FORM.socialInteraction);
  const [workoutDone, setWorkoutDone] = useState(DEFAULT_CHECK_IN_FORM.workoutDone);
  const [exerciseDuration, setExerciseDuration] = useState(DEFAULT_CHECK_IN_FORM.exerciseDuration);
  const [workoutType, setWorkoutType] = useState(DEFAULT_CHECK_IN_FORM.workoutType);
  const [pagesRead, setPagesRead] = useState(DEFAULT_CHECK_IN_FORM.pagesRead);
  const [bookName, setBookName] = useState(DEFAULT_CHECK_IN_FORM.bookName);
  const [studyHours, setStudyHours] = useState(DEFAULT_CHECK_IN_FORM.studyHours);
  const [studyTopic, setStudyTopic] = useState(DEFAULT_CHECK_IN_FORM.studyTopic);
  const [notes, setNotes] = useState(DEFAULT_CHECK_IN_FORM.notes);
  const [wins, setWins] = useState(DEFAULT_CHECK_IN_FORM.wins);
  const [challenges, setChallenges] = useState(DEFAULT_CHECK_IN_FORM.challenges);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const formSetters = {
    setMoodScore,
    setSleepHours,
    setSleepQuality,
    setEnergyLevel,
    setFocusLevel,
    setProductivityLevel,
    setStressLevel,
    setWaterIntake,
    setJunkFood,
    setSocialInteraction,
    setWorkoutDone,
    setExerciseDuration,
    setWorkoutType,
    setPagesRead,
    setBookName,
    setStudyHours,
    setStudyTopic,
    setNotes,
    setWins,
    setChallenges,
  };

  const existingEntry = useMemo(
    () => entries.find((e) => e.date === date),
    [entries, date]
  );

  const isToday = date === todayString();
  const isEditing = Boolean(existingEntry);

  useEffect(() => {
    const paramDate = searchParams.get("date");
    if (paramDate && paramDate !== date) {
      setDate(paramDate);
    }
  }, [searchParams]);

  const loadFormForDate = (targetDate: string) => {
    const entry = entries.find((e) => e.date === targetDate);
    if (entry) {
      applyFormState(formSetters, entryToCheckInForm(entry));
    } else {
      applyFormState(formSetters, DEFAULT_CHECK_IN_FORM);
    }
    setSaveMessage(null);
  };

  useEffect(() => {
    loadFormForDate(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset form when the selected date changes
  }, [date]);

  useEffect(() => {
    if (entries.length === 0) return;
    loadFormForDate(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once when cloud entries first arrive
  }, [entries.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    const life_score = calculateLifeScore({ moodScore, sleepQuality, focusLevel, productivityLevel, stressLevel, workoutDone });
    const payload = {
      date,
      mood_score: moodScore,
      mood_label: MOOD_LABELS[moodScore - 1],
      sleep_hours: sleepHours,
      sleep_quality: sleepQuality,
      energy_level: energyLevel,
      focus_level: focusLevel,
      productivity_level: productivityLevel,
      stress_level: stressLevel,
      water_intake: waterIntake,
      junk_food: junkFood,
      social_interaction: socialInteraction,
      workout_done: workoutDone,
      exercise_duration: workoutDone ? exerciseDuration : 0,
      workout_type: workoutDone ? workoutType : "",
      pages_read: pagesRead,
      book_name: pagesRead > 0 ? bookName : "",
      study_hours: studyHours,
      study_topic: studyHours > 0 ? studyTopic : "",
      notes,
      wins,
      challenges,
      life_score,
    };
    const success = await addOrUpdateEntry(payload);
    setSaving(false);
    if (success) {
      setSaveMessage(isEditing ? "Check-in updated for this day." : "Check-in saved for this day.");
    } else {
      setSaveMessage("Could not save. Try syncing again.");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete check-in for ${date}?`)) return;
    const ok = await deleteEntry(date);
    if (ok) {
      applyFormState(formSetters, DEFAULT_CHECK_IN_FORM);
      setSaveMessage("Check-in deleted.");
      if (!isToday) {
        setDate(todayString());
      }
    }
  };

  const lifeScore = calculateLifeScore({ moodScore, sleepQuality, focusLevel, productivityLevel, stressLevel, workoutDone });

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <PageShell maxWidth="3xl">
        <div className="bg-card rounded-2xl px-4 py-5 sm:px-6 shadow-sm border border-border mb-6">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold">
                {isEditing ? "Update Check-In" : "Daily Check-In"}
              </h1>
              <p className="text-sm text-muted-foreground">{dateLabel}</p>
            </div>
            <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                type="date"
                value={date}
                max={todayString()}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background border-border h-10 text-sm w-full sm:w-auto cursor-pointer"
              />
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 cursor-pointer w-full sm:w-auto"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          <div
            className={cn(
              "mt-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl px-4 py-3 border",
              isEditing
                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
            )}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {isEditing ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Save className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-xs font-semibold leading-relaxed",
                    isEditing
                      ? "text-emerald-800 dark:text-emerald-200"
                      : "text-amber-800 dark:text-amber-200"
                  )}
                >
                  {isEditing
                    ? "You already checked in for this day — edit below and save updates."
                    : isToday
                      ? "No check-in yet for today — fill in your metrics below."
                      : "No check-in saved for this date — you can log it now."}
                </p>
                {isSyncing && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">Syncing with cloud…</p>
                )}
                {saveMessage && (
                  <p className="text-[11px] font-medium text-teal-700 dark:text-teal-400 mt-1">{saveMessage}</p>
                )}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 text-white font-black text-sm shadow-sm shrink-0 self-start sm:self-center">
              {lifeScore}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center ring-1 ring-amber-200">
                <Smile className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Mind & Mood</CardTitle>
                <CardDescription className="text-xs">Subjective emotional baseline</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold text-slate-700">Mood Today</Label>
                  <span className={`text-sm font-bold ${MOOD_COLORS[moodScore - 1]}`}>
                    {MOOD_EMOJIS[moodScore - 1]} {MOOD_LABELS[moodScore - 1]}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={moodScore}
                    onChange={(e) => setMoodScore(parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((moodScore - 1) / 7) * 100}%, #e2e8f0 ${((moodScore - 1) / 7) * 100}%, #e2e8f0 100%)`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Terrible</span>
                  <span>Harvey 🔥</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SliderField label="Energy Level" value={energyLevel} min={1} max={10} onChange={setEnergyLevel} />
                <SliderField label="Stress Level" value={stressLevel} min={1} max={10} onChange={setStressLevel} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center ring-1 ring-sky-200">
                <Moon className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Sleep & Rest</CardTitle>
                <CardDescription className="text-xs">Duration and quality patterns</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Sleep Duration (hrs)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="24"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Water Intake (ml)</Label>
                  <Input
                    type="number"
                    value={waterIntake}
                    onChange={(e) => setWaterIntake(parseInt(e.target.value) || 0)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10"
                  />
                </div>
              </div>
              <SliderField label="Sleep Quality" value={sleepQuality} min={1} max={10} onChange={setSleepQuality} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-200">
                <Brain className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Productivity & Focus</CardTitle>
                <CardDescription className="text-xs">Mental bandwidth and output metrics</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SliderField label="Productivity" value={productivityLevel} min={1} max={10} onChange={setProductivityLevel} />
                <SliderField label="Focus Level" value={focusLevel} min={1} max={10} onChange={setFocusLevel} />
              </div>
              <SliderField label="Social Interaction" value={socialInteraction} min={1} max={10} onChange={setSocialInteraction} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Study Hours</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={studyHours}
                    onChange={(e) => setStudyHours(parseFloat(e.target.value) || 0)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Study Topic</Label>
                  <Input
                    type="text"
                    value={studyTopic}
                    placeholder="e.g. TypeScript"
                    onChange={(e) => setStudyTopic(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center ring-1 ring-teal-200">
                <Flame className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Health & Physical Habits</CardTitle>
                <CardDescription className="text-xs">Exercise, hydration, and nutrition tracking</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Workout Done</p>
                    <p className="text-xs text-slate-400">Enable to log exercise details</p>
                  </div>
                </div>
                <Switch checked={workoutDone} onCheckedChange={setWorkoutDone} className="data-[state=checked]:bg-teal-500" />
              </div>

              {workoutDone && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Duration (min)</Label>
                    <Input
                      type="number"
                      value={exerciseDuration}
                      onChange={(e) => setExerciseDuration(parseInt(e.target.value) || 0)}
                      className="bg-slate-50 border-slate-200 text-slate-800 h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Workout Type</Label>
                    <Input
                      type="text"
                      value={workoutType}
                      placeholder="e.g. Running"
                      onChange={(e) => setWorkoutType(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-slate-800 h-10"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Ate Junk Food?</p>
                  <p className="text-xs text-slate-400">Unhealthy nutrition today</p>
                </div>
                <Switch checked={junkFood} onCheckedChange={setJunkFood} className="data-[state=checked]:bg-rose-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Pages Read</Label>
                  <Input
                    type="number"
                    value={pagesRead}
                    onChange={(e) => setPagesRead(parseInt(e.target.value) || 0)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Book Name</Label>
                  <Input
                    type="text"
                    value={bookName}
                    placeholder="e.g. Atomic Habits"
                    onChange={(e) => setBookName(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">Daily Reflection</CardTitle>
              <CardDescription className="text-xs text-slate-400">Journal, wins and challenges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Todays Wins</Label>
                <Textarea
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  placeholder="What went well today..."
                  className="bg-slate-50 border-slate-200 text-slate-800 resize-none h-20 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Challenges</Label>
                <Textarea
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="Obstacles or struggles..."
                  className="bg-slate-50 border-slate-200 text-slate-800 resize-none h-20 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">General Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any other thoughts..."
                  className="bg-slate-50 border-slate-200 text-slate-800 resize-none h-24 placeholder:text-slate-400"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pb-4">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold cursor-pointer h-12 text-base rounded-xl shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all"
            >
              <Save className="mr-2 h-5 w-5" />
              {saving ? "Saving..." : isEditing ? "Update Check-In" : "Save Check-In"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer rounded-xl h-12 px-6"
            >
              Dashboard
            </Button>
          </div>
        </form>
    </PageShell>
  );
}
