"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLifeStore } from "@/store/useLifeStore";
import { calculateLifeScore } from "@/lib/formulas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Navigation } from "@/components/navigation";
import { Save, Smile, Moon, Brain, Flame, Trash2, Activity, BookOpen, Clock } from "lucide-react";

const MOOD_LABELS = ["Terrible", "Bad", "Below Average", "Average", "Good", "Great", "Excellent", "Harvey"];
const MOOD_COLORS = ["text-rose-600", "text-orange-500", "text-amber-500", "text-yellow-500", "text-lime-500", "text-green-500", "text-emerald-500", "text-teal-600"];
const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😊", "😄", "🌟", "🔥"];

function SliderField({ label, value, min, max, onChange, color = "teal" }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; color?: string; }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-semibold text-slate-700">{label}</Label>
        <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg min-w-[40px] text-center">
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

export default function CheckInPage() {
  const router = useRouter();
  const addOrUpdateEntry = useLifeStore((state) => state.addOrUpdateEntry);
  const deleteEntry = useLifeStore((state) => state.deleteEntry);
  const entries = useLifeStore((state) => state.entries);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [moodScore, setMoodScore] = useState(5);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [focusLevel, setFocusLevel] = useState(7);
  const [productivityLevel, setProductivityLevel] = useState(7);
  const [stressLevel, setStressLevel] = useState(4);
  const [waterIntake, setWaterIntake] = useState(2000);
  const [junkFood, setJunkFood] = useState(false);
  const [socialInteraction, setSocialInteraction] = useState(5);
  const [workoutDone, setWorkoutDone] = useState(false);
  const [exerciseDuration, setExerciseDuration] = useState(30);
  const [workoutType, setWorkoutType] = useState("");
  const [pagesRead, setPagesRead] = useState(0);
  const [bookName, setBookName] = useState("");
  const [studyHours, setStudyHours] = useState(0);
  const [studyTopic, setStudyTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [wins, setWins] = useState("");
  const [challenges, setChallenges] = useState("");
  const [saving, setSaving] = useState(false);

  const existingEntry = entries.find((e) => e.date === date);

  const loadExistingLog = () => {
    if (existingEntry) {
      setMoodScore(existingEntry.mood_score);
      setSleepHours(existingEntry.sleep_hours || 7);
      setSleepQuality(existingEntry.sleep_quality || 7);
      setEnergyLevel(existingEntry.energy_level || 7);
      setFocusLevel(existingEntry.focus_level || 7);
      setProductivityLevel(existingEntry.productivity_level || 7);
      setStressLevel(existingEntry.stress_level || 5);
      setWaterIntake(existingEntry.water_intake || 2000);
      setJunkFood(!!existingEntry.junk_food);
      setSocialInteraction(existingEntry.social_interaction || 5);
      setWorkoutDone(!!existingEntry.workout_done);
      setExerciseDuration(existingEntry.exercise_duration || 30);
      setWorkoutType(existingEntry.workout_type || "");
      setPagesRead(existingEntry.pages_read || 0);
      setBookName(existingEntry.book_name || "");
      setStudyHours(existingEntry.study_hours || 0);
      setStudyTopic(existingEntry.study_topic || "");
      setNotes(existingEntry.notes || "");
      setWins(existingEntry.wins || "");
      setChallenges(existingEntry.challenges || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const life_score = calculateLifeScore({ moodScore, sleepQuality, focusLevel, productivityLevel, stressLevel, workoutDone });
    const payload = {
      date, mood_score: moodScore, mood_label: MOOD_LABELS[moodScore - 1],
      sleep_hours: sleepHours, sleep_quality: sleepQuality, energy_level: energyLevel,
      focus_level: focusLevel, productivity_level: productivityLevel, stress_level: stressLevel,
      water_intake: waterIntake, junk_food: junkFood, social_interaction: socialInteraction,
      workout_done: workoutDone, exercise_duration: workoutDone ? exerciseDuration : 0,
      workout_type: workoutDone ? workoutType : "",
      pages_read: pagesRead, book_name: pagesRead > 0 ? bookName : "",
      study_hours: studyHours, study_topic: studyHours > 0 ? studyTopic : "",
      notes, wins, challenges, life_score,
    };
    const success = await addOrUpdateEntry(payload);
    setSaving(false);
    if (success) router.push("/");
  };

  const handleDelete = async () => {
    if (confirm(`Delete log for ${date}?`)) {
      await deleteEntry(date);
      router.push("/");
    }
  };

  const lifeScore = calculateLifeScore({ moodScore, sleepQuality, focusLevel, productivityLevel, stressLevel, workoutDone });

  return (
    <div className="min-h-screen bg-slate-50 font-sans md:pl-64 pb-24">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl px-6 py-5 shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Daily Check-In</h1>
              <p className="text-sm text-slate-500">Log your metrics to track patterns over time</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white border-slate-200 text-slate-700 h-9 text-sm w-auto cursor-pointer"
              />
              {existingEntry && (
                <Button variant="outline" onClick={loadExistingLog} size="sm" className="border-slate-200 text-slate-600 cursor-pointer text-xs">
                  Load Saved
                </Button>
              )}
              {existingEntry && (
                <Button variant="outline" onClick={handleDelete} size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          {/* Live Life Score Preview */}
          <div className="mt-4 flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white font-black text-sm shadow-sm">
              {lifeScore}
            </div>
            <div>
              <p className="text-xs font-semibold text-teal-700">Live Life Score Preview</p>
              <p className="text-[11px] text-teal-600">Updates as you adjust sliders below</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mood Card */}
          <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center ring-1 ring-amber-200">
                <Smile className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Mind & Mood</CardTitle>
                <CardDescription className="text-xs text-slate-400">Subjective emotional baseline</CardDescription>
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
                    type="range" min="1" max="8" value={moodScore}
                    onChange={(e) => setMoodScore(parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((moodScore - 1) / 7) * 100}%, #e2e8f0 ${((moodScore - 1) / 7) * 100}%, #e2e8f0 100%)` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Terrible</span><span>Harvey 🔥</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SliderField label="Energy Level" value={energyLevel} min={1} max={10} onChange={setEnergyLevel} />
                <SliderField label="Stress Level" value={stressLevel} min={1} max={10} onChange={setStressLevel} />
              </div>
            </CardContent>
          </Card>

          {/* Sleep Card */}
          <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center ring-1 ring-sky-200">
                <Moon className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Sleep & Rest</CardTitle>
                <CardDescription className="text-xs text-slate-400">Duration and quality patterns</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Sleep Duration (hrs)</Label>
                  <Input type="number" step="0.1" min="0" max="24" value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Water Intake (ml)</Label>
                  <Input type="number" value={waterIntake}
                    onChange={(e) => setWaterIntake(parseInt(e.target.value) || 0)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10" />
                </div>
              </div>
              <SliderField label="Sleep Quality" value={sleepQuality} min={1} max={10} onChange={setSleepQuality} />
            </CardContent>
          </Card>

          {/* Productivity Card */}
          <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-200">
                <Brain className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Productivity & Focus</CardTitle>
                <CardDescription className="text-xs text-slate-400">Mental bandwidth and output metrics</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SliderField label="Productivity" value={productivityLevel} min={1} max={10} onChange={setProductivityLevel} />
                <SliderField label="Focus Level" value={focusLevel} min={1} max={10} onChange={setFocusLevel} />
              </div>
              <SliderField label="Social Interaction" value={socialInteraction} min={1} max={10} onChange={setSocialInteraction} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Study Hours</Label>
                  <Input type="number" step="0.1" min="0" value={studyHours}
                    onChange={(e) => setStudyHours(parseFloat(e.target.value) || 0)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Study Topic</Label>
                  <Input type="text" value={studyTopic} placeholder="e.g. TypeScript"
                    onChange={(e) => setStudyTopic(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Card */}
          <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center ring-1 ring-teal-200">
                <Flame className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Health & Physical Habits</CardTitle>
                <CardDescription className="text-xs text-slate-400">Exercise, hydration, and nutrition tracking</CardDescription>
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
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Duration (min)</Label>
                    <Input type="number" value={exerciseDuration}
                      onChange={(e) => setExerciseDuration(parseInt(e.target.value) || 0)}
                      className="bg-slate-50 border-slate-200 text-slate-800 h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Workout Type</Label>
                    <Input type="text" value={workoutType} placeholder="e.g. Running"
                      onChange={(e) => setWorkoutType(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-slate-800 h-10" />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Pages Read</Label>
                  <Input type="number" value={pagesRead}
                    onChange={(e) => setPagesRead(parseInt(e.target.value) || 0)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Book Name</Label>
                  <Input type="text" value={bookName} placeholder="e.g. Atomic Habits"
                    onChange={(e) => setBookName(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reflection Card */}
          <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">Daily Reflection</CardTitle>
              <CardDescription className="text-xs text-slate-400">Journal, wins and challenges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">✅ Today's Wins</Label>
                <Textarea value={wins} onChange={(e) => setWins(e.target.value)}
                  placeholder="What went well today..."
                  className="bg-slate-50 border-slate-200 text-slate-800 resize-none h-20 placeholder:text-slate-400" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">⚡ Challenges</Label>
                <Textarea value={challenges} onChange={(e) => setChallenges(e.target.value)}
                  placeholder="Obstacles or struggles..."
                  className="bg-slate-50 border-slate-200 text-slate-800 resize-none h-20 placeholder:text-slate-400" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">📝 General Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any other thoughts..."
                  className="bg-slate-50 border-slate-200 text-slate-800 resize-none h-24 placeholder:text-slate-400" />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 pb-4">
            <Button type="submit" disabled={saving}
              className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold cursor-pointer h-12 text-base rounded-xl shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all">
              <Save className="mr-2 h-5 w-5" />
              {saving ? "Saving..." : existingEntry ? "Update Check-In" : "Save Check-In"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/")}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer rounded-xl h-12 px-6">
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
