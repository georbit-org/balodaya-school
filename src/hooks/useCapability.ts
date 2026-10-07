'use client';

import { useState, useEffect } from 'react';

export interface ClientCapabilities {
  canWebGL: boolean;
  prefersReducedMotion: boolean;
  saveData: boolean;
  isLowEnd: boolean;
  enable3D: boolean;
}

export function useCapability(): ClientCapabilities {
  const [capabilities, setCapabilities] = useState<ClientCapabilities>({
    canWebGL: true,
    prefersReducedMotion: false,
    saveData: false,
    isLowEnd: false,
    enable3D: true,
  });

  useEffect(() => {
    // 1. Check WebGL support
    let canWebGL = false;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      canWebGL = Boolean(gl && gl instanceof WebGLRenderingContext);
    } catch {
      canWebGL = false;
    }

    // 2. Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 3. Check save data
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const saveData = Boolean(nav.connection?.saveData);

    // 4. Check hardware concurrency
    const concurrency = navigator.hardwareConcurrency || 4;
    const isLowEnd = concurrency < 4;

    // 5. Determine whether to enable full 3D
    const enable3D = canWebGL && !prefersReducedMotion && !saveData && !isLowEnd;

    requestAnimationFrame(() => {
      setCapabilities({
        canWebGL,
        prefersReducedMotion,
        saveData,
        isLowEnd,
        enable3D,
      });
    });
  }, []);

  return capabilities;
}
