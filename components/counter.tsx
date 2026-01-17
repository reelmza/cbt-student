"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "countdown_end_time";

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export default function CountdownTimer({
  durationInSeconds,
  onComplete,
}: {
  durationInSeconds: number;
  onComplete?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let endTime = localStorage.getItem(STORAGE_KEY);

    // If no existing timer, create one
    if (!endTime) {
      endTime = String(Date.now() + durationInSeconds * 1000);
      localStorage.setItem(STORAGE_KEY, endTime);
    }

    const endTimestamp = Number(endTime);

    const interval = setInterval(() => {
      const remainingSeconds = Math.max(
        0,
        Math.floor((endTimestamp - Date.now()) / 1000)
      );

      setTimeLeft(remainingSeconds);

      if (remainingSeconds === 0) {
        clearInterval(interval);
        localStorage.removeItem(STORAGE_KEY);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [durationInSeconds, onComplete]);

  const { hours, minutes, seconds } = formatTime(timeLeft);

  return (
    <>
      {hours}:{minutes}:{seconds}
    </>
  );
}
