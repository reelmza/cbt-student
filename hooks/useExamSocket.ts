"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface ExamSocketCallbacks {
  onLocked: (data: { reason: string; violationCount: number }) => void;
  onUnlocked: (data: { assessmentId: string }) => void;
  onForceSubmit: (data: { reason: string }) => void;
}

interface UseExamSocketOptions extends ExamSocketCallbacks {
  assessmentId: string;
  studentId: string;
  name: string;
  enabled: boolean;
}

export function useExamSocket({
  assessmentId,
  studentId,
  name,
  enabled,
  onLocked,
  onUnlocked,
  onForceSubmit,
}: UseExamSocketOptions) {
  // Keep callbacks in refs so socket listeners never become stale
  const onLockedRef = useRef(onLocked);
  const onUnlockedRef = useRef(onUnlocked);
  const onForceSubmitRef = useRef(onForceSubmit);

  useEffect(() => {
    onLockedRef.current = onLocked;
    onUnlockedRef.current = onUnlocked;
    onForceSubmitRef.current = onForceSubmit;
  });

  useEffect(() => {
    if (!enabled || !assessmentId || !studentId) return;

    const socket: Socket = io("https://womenlegacyacademy.com", {
      path: "/socket.io",
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Connected to socket server", studentId);
      socket.emit("join-assessment", { assessmentId, studentId, name });
    });

    socket.on(
      "exam-locked",
      (data: { reason: string; violationCount: number }) => {
        onLockedRef.current(data);
      },
    );

    socket.on("exam-unlocked", (data: { assessmentId: string }) => {
      onUnlockedRef.current(data);
    });

    socket.on("assessment:force-submit", (data: { reason: string }) => {
      onForceSubmitRef.current(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled, assessmentId, studentId, name]);
}
