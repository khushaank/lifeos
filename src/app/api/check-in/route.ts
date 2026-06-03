import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("lifeos_session")?.value;
    const systemSecret = process.env.SESSION_SECRET || "default-secret-string-at-least-32-chars";

    if (!sessionToken || !(await verifySessionToken(sessionToken, systemSecret))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await request.json();
    const {
      date,
      mood_label,
      mood_score,
      bedtime,
      wake_time,
      sleep_hours,
      sleep_quality,
      energy_level,
      focus_level,
      productivity_level,
      stress_level,
      water_intake,
      junk_food,
      social_interaction,
      notes,
      wins,
      challenges,
      life_score,
      workout_done,
      exercise_duration,
      workout_type,
      pages_read,
      book_name,
      study_hours,
      study_topic,
    } = body;

    if (!date || !mood_label || !mood_score) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert or update daily entry
    const entryData = {
      date,
      mood_label,
      mood_score,
      bedtime: bedtime || null,
      wake_time: wake_time || null,
      sleep_hours: sleep_hours !== undefined ? sleep_hours : null,
      sleep_quality: sleep_quality !== undefined ? sleep_quality : null,
      energy_level: energy_level !== undefined ? energy_level : null,
      focus_level: focus_level !== undefined ? focus_level : null,
      productivity_level: productivity_level !== undefined ? productivity_level : null,
      stress_level: stress_level !== undefined ? stress_level : null,
      water_intake: water_intake !== undefined ? water_intake : null,
      junk_food: !!junk_food,
      social_interaction: social_interaction !== undefined ? social_interaction : null,
      notes: notes || null,
      wins: wins || null,
      challenges: challenges || null,
      life_score: life_score || 0,
    };

    // Upsert daily entry
    const { data: upsertData, error: upsertError } = await supabaseAdmin
      .from("daily_entries")
      .upsert(entryData, { onConflict: "date" })
      .select()
      .single();

    if (upsertError || !upsertData) {
      return NextResponse.json({ error: `Daily Entry save error: ${upsertError?.message}` }, { status: 500 });
    }

    const entryId = upsertData.id;

    // Delete existing sub-logs to refresh
    await supabaseAdmin.from("exercise_logs").delete().eq("entry_id", entryId);
    await supabaseAdmin.from("reading_logs").delete().eq("entry_id", entryId);
    await supabaseAdmin.from("study_logs").delete().eq("entry_id", entryId);

    // Save sub-logs if applicable
    if (workout_done || (exercise_duration && exercise_duration > 0)) {
      await supabaseAdmin.from("exercise_logs").insert({
        entry_id: entryId,
        date,
        workout_done: !!workout_done,
        duration_minutes: exercise_duration || 0,
        workout_type: workout_type || "",
      });
    }

    if (pages_read && pages_read > 0) {
      await supabaseAdmin.from("reading_logs").insert({
        entry_id: entryId,
        date,
        pages_read,
        book_name: book_name || "",
      });
    }

    if (study_hours && study_hours > 0) {
      await supabaseAdmin.from("study_logs").insert({
        entry_id: entryId,
        date,
        study_hours,
        topic: study_topic || "",
      });
    }

    return NextResponse.json({ success: true, id: entryId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Check-in save failure" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("lifeos_session")?.value;
    const systemSecret = process.env.SESSION_SECRET || "default-secret-string-at-least-32-chars";

    if (!sessionToken || !(await verifySessionToken(sessionToken, systemSecret))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("daily_entries").delete().eq("date", date);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Deletion failure" }, { status: 500 });
  }
}
