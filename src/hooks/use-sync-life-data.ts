"use client";

import { useEffect } from "react";
import { useLifeStore } from "@/store/useLifeStore";

/** Background refresh only when cache is stale — no loading flash on navigation */
export function useSyncLifeData() {
  const syncAll = useLifeStore((s) => s.syncAll);

  useEffect(() => {
    void syncAll({ silent: true });
  }, [syncAll]);
}
