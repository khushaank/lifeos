"use client";

import { useExperimentNotifications } from "@/hooks/use-experiment-notifications";

/** Mount once inside authenticated app to schedule daily experiment reminders */
export function ExperimentNotifications() {
  useExperimentNotifications();
  return null;
}
