import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/security";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("lifeos_session")?.value;
    const systemSecret = process.env.SESSION_SECRET || "default-secret-string-at-least-32-chars";

    if (!sessionToken || !(await verifySessionToken(sessionToken, systemSecret))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Query daily entries along with related logs
    const { data, error } = await supabaseAdmin
      .from("daily_entries")
      .select(`
        *,
        exercise_logs(workout_done, duration_minutes, workout_type),
        reading_logs(pages_read, book_name),
        study_logs(study_hours, topic)
      `)
      .order("date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format output to conform with Zustand's LogEntry structure
    const formattedEntries = (data || []).map((entry: any) => {
      const exercise = entry.exercise_logs?.[0];
      const reading = entry.reading_logs?.[0];
      const study = entry.study_logs?.[0];

      return {
        id: entry.id,
        date: entry.date,
        mood_label: entry.mood_label,
        mood_score: entry.mood_score,
        bedtime: entry.bedtime || "",
        wake_time: entry.wake_time || "",
        sleep_hours: entry.sleep_hours ? parseFloat(entry.sleep_hours) : 0,
        sleep_quality: entry.sleep_quality || 0,
        energy_level: entry.energy_level || 0,
        focus_level: entry.focus_level || 0,
        productivity_level: entry.productivity_level || 0,
        stress_level: entry.stress_level || 0,
        water_intake: entry.water_intake ? parseFloat(entry.water_intake) : 0,
        junk_food: entry.junk_food || false,
        social_interaction: entry.social_interaction || 0,
        notes: entry.notes || "",
        wins: entry.wins || "",
        challenges: entry.challenges || "",
        life_score: entry.life_score ? parseFloat(entry.life_score) : 0,
        
        workout_done: exercise?.workout_done || false,
        exercise_duration: exercise?.duration_minutes || 0,
        workout_type: exercise?.workout_type || "",
        
        pages_read: reading?.pages_read || 0,
        book_name: reading?.book_name || "",
        
        study_hours: study?.study_hours ? parseFloat(study?.study_hours) : 0,
        study_topic: study?.topic || "",
      };
    });

    return NextResponse.json({ entries: formattedEntries });
  } catch (err: any) {
    return NextResponse.json({ error: "Fetch error entries query failure" }, { status: 500 });
  }
}
