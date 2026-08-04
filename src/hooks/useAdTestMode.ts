import { useCallback, useEffect, useState } from "react";
import { defaultAdTestMode, getAdTestMode, setAdTestMode } from "@/lib/ads";

/** Reactive access to the AdMob test-mode setting (persisted in localStorage). */
export function useAdTestMode() {
  const [testMode, setState] = useState<boolean>(() => defaultAdTestMode());

  useEffect(() => {
    setState(getAdTestMode());
    const sync = () => setState(getAdTestMode());
    window.addEventListener("admob-test-mode-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("admob-test-mode-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((enabled: boolean) => {
    setAdTestMode(enabled);
    setState(enabled);
  }, []);

  return { testMode, setTestMode: toggle };
}
