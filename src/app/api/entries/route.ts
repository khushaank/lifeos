import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api-json";

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: dailyEntries, error: deError } = await supabaseAdmin
      .from("daily_entries")
      .select("*")
      .order("date", { ascending: false });

    if (deError) throw deError;

    const { data: exerciseLogs, error: exError } = await supabaseAdmin
      .from("exercise_logs")
      .select("*");

    if (exError) throw exError;

    const { data: readingLogs, error: rdError } = await supabaseAdmin
      .from("reading_logs")
      .select("*");

    if (rdError) throw rdError;

    const { data: studyLogs, error: stError } = await supabaseAdmin
      .from("study_logs")
      .select("*");

    if (stError) throw stError;

    const combined = (dailyEntries || []).map((entry) => {
      const exercise = (exerciseLogs || []).find((x) => x.entry_id === entry.id || x.date === entry.date);
      const reading = (readingLogs || []).find((x) => x.entry_id === entry.id || x.date === entry.date);
      const study = (studyLogs || []).find((x) => x.entry_id === entry.id || x.date === entry.date);

      return {
        id: entry.id,
        date: entry.date,
        mood_label: entry.mood_label,
        mood_score: entry.mood_score,
        bedtime: entry.bedtime || undefined,
        wake_time: entry.wake_time || undefined,
        sleep_hours: entry.sleep_hours ? Number(entry.sleep_hours) : undefined,
        sleep_quality: entry.sleep_quality || undefined,
        energy_level: entry.energy_level || undefined,
        focus_level: entry.focus_level || undefined,
        productivity_level: entry.productivity_level || undefined,
        stress_level: entry.stress_level || undefined,
        water_intake: entry.water_intake ? Number(entry.water_intake) : undefined,
        junk_food: Boolean(entry.junk_food),
        social_interaction: entry.social_interaction || undefined,
        notes: entry.notes || undefined,
        wins: entry.wins || undefined,
        challenges: entry.challenges || undefined,
        life_score: entry.life_score ? Number(entry.life_score) : 0,

        // Exercise Sub-Log
        workout_done: exercise?.workout_done || false,
        exercise_duration: exercise?.duration_minutes || 0,
        workout_type: exercise?.workout_type || "",
        workout_selfie: exercise?.selfie_url || "",

        // Reading Sub-Log
        pages_read: reading?.pages_read || 0,
        book_name: reading?.book_name || "",
        book_id: reading?.book_id || "",

        // Study Sub-Log
        study_hours: study?.study_hours ? Number(study.study_hours) : 0,
        study_topic: study?.topic || "",
      };
    });

    return NextResponse.json(combined);
  } catch (err) {
    console.error("Failed to fetch entries:", err);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await parseJsonBody(request);
    if (!payload?.date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const { data: entryData, error: entryError } = await supabaseAdmin
      .from("daily_entries")
      .upsert({
        date: payload.date,
        mood_label: payload.mood_label,
        mood_score: payload.mood_score,
        bedtime: payload.bedtime || null,
        wake_time: payload.wake_time || null,
        sleep_hours: payload.sleep_hours || null,
        sleep_quality: payload.sleep_quality || null,
        energy_level: payload.energy_level || null,
        focus_level: payload.focus_level || null,
        productivity_level: payload.productivity_level || null,
        stress_level: payload.stress_level || null,
        water_intake: payload.water_intake || null,
        junk_food: payload.junk_food || false,
        social_interaction: payload.social_interaction || null,
        notes: payload.notes || null,
        wins: payload.wins || null,
        challenges: payload.challenges || null,
        life_score: payload.life_score || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: "date" })
      .select("id")
      .single();

    if (entryError || !entryData) {
      throw entryError || new Error("Failed to retrieve upserted entry ID");
    }

    // Delete existing related logs to perform clean inserts
    await supabaseAdmin.from("exercise_logs").delete().eq("entry_id", entryData.id);
    await supabaseAdmin.from("reading_logs").delete().eq("entry_id", entryData.id);
    await supabaseAdmin.from("study_logs").delete().eq("entry_id", entryData.id);

    // Insert sub-logs
    if (payload.workout_done || payload.exercise_duration || payload.workout_type) {
      const exerciseRow: Record<string, unknown> = {
        entry_id: entryData.id,
        date: payload.date,
        workout_done: payload.workout_done || false,
        duration_minutes: payload.exercise_duration || 0,
        workout_type: payload.workout_type || "",
      };
      if (payload.workout_selfie) {
        exerciseRow.selfie_url = payload.workout_selfie;
      }
      await supabaseAdmin.from("exercise_logs").insert(exerciseRow);
    }

    if (payload.pages_read || payload.book_name) {
      await supabaseAdmin.from("reading_logs").insert({
        entry_id: entryData.id,
        date: payload.date,
        pages_read: payload.pages_read || 0,
        book_name: payload.book_name || "",
        book_id: payload.book_id || null,
      });
    }

    if (payload.study_hours || payload.study_topic) {
      await supabaseAdmin.from("study_logs").insert({
        entry_id: entryData.id,
        date: payload.date,
        study_hours: payload.study_hours || 0,
        topic: payload.study_topic || "",
      });
    }

    return NextResponse.json({ success: true, id: entryData.id });
  } catch (err) {
    console.error("Failed to save entry:", err);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    // Delete daily entry (sub-logs cascade delete automatically in schema)
    const { error } = await supabaseAdmin
      .from("daily_entries")
      .delete()
      .eq("date", date);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete entry:", err);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
