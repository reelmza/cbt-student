"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  timeLeftParams,
  timePaused,
}: {
  durationInSeconds: number;
  onComplete?: () => void;
  timeLeftParams: {
    globalTimeLeft: number | null;
    setGlobalTimeLeft: Dispatch<SetStateAction<number | null>>;
  };
  timePaused: boolean;
}) {
  const [localTimeLeft, setLocalTimeLeft] = useState(0);
  const { setGlobalTimeLeft } = timeLeftParams;
  const endTimestampRef = useRef<number>(null);
  const intervalRef = useRef<NodeJS.Timeout>(null);
  const pausedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (timePaused) {
      pausedAtRef.current = Date.now();
      intervalRef.current && clearInterval(intervalRef.current);
      return;
    }

    // Shift the end timestamp forward by however long we were paused
    if (endTimestampRef.current && pausedAtRef.current) {
      endTimestampRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }

    if (!endTimestampRef.current) {
      endTimestampRef.current = Date.now() + durationInSeconds * 1000;
    }

    intervalRef.current = setInterval(() => {
      const remainingSeconds = Math.max(
        0,
        Math.floor((endTimestampRef.current! - Date.now()) / 1000),
      );

      setLocalTimeLeft(remainingSeconds); // For the internal UI
      setGlobalTimeLeft(remainingSeconds); // For other upper components that might need it

      // Timer toasts messages
      if (remainingSeconds === 120) {
        toast.info("You have Two (2) minute remaining", {
          position: "top-right",
        });
      }

      if (remainingSeconds === 60) {
        toast.info("You have One (1) minute remaining", {
          position: "top-right",
        });
      }

      if (remainingSeconds === 0) {
        intervalRef.current && clearInterval(intervalRef.current);
        onComplete?.();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [durationInSeconds, onComplete, timePaused]);

  const { hours, minutes, seconds } = formatTime(localTimeLeft);

  return (
    <div className={`${Number(minutes) < 5 ? "text-red-600" : ""}`}>
      {hours}:{minutes}:{seconds}
    </div>
  );
}
