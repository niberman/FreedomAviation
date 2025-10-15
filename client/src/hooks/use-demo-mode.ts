import { useEffect, useState } from "react";

export function useDemoMode() {
  const [isDemo, setIsDemo] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const readonlyParam = params.get('readonly');
    const seedParam = params.get('seed');
    
    setIsDemo(readonlyParam === '1');
    setSeed(seedParam);
  }, []);

  return { isDemo, seed };
}
