"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

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
  timeLeftParams,
}: {
  durationInSeconds: number;
  onComplete?: () => void;
  timeLeftParams: {
    timeLeftX: number | null;
    setTimeLeftX: Dispatch<SetStateAction<number | null>>;
  };
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const { setTimeLeftX } = timeLeftParams;
  const endTimestampRef = useRef<number>(null);

  // useEffect(() => {
  //   // let endTime = localStorage.getItem(STORAGE_KEY);

  //   // Avoid timer restart on auto submit
  //   // if (endTime === "auto_submit") {
  //   //   return;
  //   // }

  //   // If no existing timer, create one
  //   // if (!endTime) {
  //   let endTime = String(Date.now() + durationInSeconds * 1000);
  //   // localStorage.setItem(STORAGE_KEY, endTime);
  //   // }

  //   const endTimestamp = Number(endTime);

  //   const interval = setInterval(() => {
  //     const remainingSeconds = Math.max(
  //       0,
  //       Math.floor((endTimestamp - Date.now()) / 1000)
  //     );

  //     setTimeLeft(remainingSeconds);
  //     // setTimeLeftX(remainingSeconds);

  //     console.log(remainingSeconds);

  //     if (remainingSeconds === 0) {
  //       clearInterval(interval);
  //       // localStorage.setItem(STORAGE_KEY, "auto_submit");
  //       onComplete?.();
  //     }
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [durationInSeconds, onComplete]);

  useEffect(() => {
    if (!endTimestampRef.current) {
      endTimestampRef.current = Date.now() + durationInSeconds * 1000;
    }

    const interval = setInterval(() => {
      const remainingSeconds = Math.max(
        0,
        Math.floor((endTimestampRef.current! - Date.now()) / 1000)
      );

      setTimeLeft(remainingSeconds);
      setTimeLeftX(remainingSeconds);

      if (remainingSeconds === 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [durationInSeconds, onComplete]);

  const { hours, minutes, seconds } = formatTime(timeLeft);

  return (
    <div className={`${Number(minutes) < 5 ? "text-red-600" : ""}`}>
      {hours}:{minutes}:{seconds}
    </div>
  );
}
