"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

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
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

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

      if (remainingSeconds === 0) {
        intervalRef.current && clearInterval(intervalRef.current);
        onCompleteRef.current?.();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [durationInSeconds, timePaused]);

  const { hours, minutes, seconds } = formatTime(localTimeLeft);

  return (
    <div
      className={`${localTimeLeft && Number(minutes) < 5 ? "text-theme-warning" : ""}`}
    >
      {hours}:{minutes}:{seconds}
    </div>
  );
}
