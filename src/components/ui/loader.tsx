'use client';

import { useEffect, useState } from 'react';

export default function Loader() {
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Start fade out at 1.8s
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, 1800);

    // Completely remove from DOM at 2.4s
    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, 2400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-white flex justify-center items-center z-[9999] transition-opacity duration-500"
      style={{ opacity }}
    >
      <div className="w-[100px] h-[2px] bg-grey overflow-hidden relative">
        <div className="absolute top-0 left-0 h-full bg-black animate-[load_1.5s_ease-in-out_forwards]" />
      </div>
    </div>
  );
}