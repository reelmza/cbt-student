"use client";

import {
  ArrowRight,
  Calculator as CalculatorIcon,
  Check,
  ChevronRightIcon,
  CircleQuestionMark,
  Clock2Icon,
  Clock4,
  CloudCheck,
  Timer,
  User2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import Button from "@/components/button";
import Calculator from "@/components/calculator";
import Counter from "@/components/counter";
import Preload from "@/components/preload";
import type { SecurityMonitorHandle } from "@/components/security-monitor";
import { SecurityMonitor } from "@/components/security-monitor";
import Spacer from "@/components/spacer";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getAxios } from "@/lib/axios";
import shuffleArray from "@/utils/array-shuffler";

const Page = ({ id }: { id: string }) => {
  const controller = new AbortController();
  const router = useRouter();
  const { data: session } = useSession();

  // Component States
  const [loading, setLoading] = useState<string | null>("page");
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [questions, setQuestions] = useState<QuestionType | null>(null);
  const [answers, setAnswers] = useState<AnswerType>({});
  const [pageData, setPageData] = useState<PageDataType | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [assSubmited, setAssSubmited] = useState<{
    autoMarked: number;
    pending: number;
    totalScore: number;
  } | null>(null);

  // Calculator
  const [showCalculator, setShowCalculator] = useState(false);

  // Modal States
  const [showEndExam, setShowEndExam] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [showExamClosed, setShowExamClosed] = useState(false);

  // Timer state
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);
  const [pauseTime, setPauseTime] = useState(false);

  // Poll
  const lastSavedRef = useRef<string | null>(null);
  const latestDataRef = useRef({ answers, timeLeft: globalTimeLeft });

  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const examDurationRef = useRef<number | null>(null);
  const pauseTimeRef = useRef(false);

  // Web sockets
  const socketRef = useRef<Socket | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const violationCountRef = useRef(0);

  // Pardon
  const [pardonCode, setPardonCode] = useState("");
  const [serverBlocked, setServerBlocked] = useState(false);
  const securityMonitorRef = useRef<SecurityMonitorHandle>(null);

  // Key press
  const questionsRef = useRef(questions);
  const activeQuestionRef = useRef(activeQuestion);

  // Split Subjective
  const parts = (text: string) => {
    return text.split(/(\[\d+\])/g);
  };

  // Next Question
  const nextQuestion = () => {
    if (questions && activeQuestion == questions.length - 1) {
      console.log("End");
      toast.success("This is the last question", { richColors: true });
    }

    setActiveQuestion((prev) => {
      if (questions && prev < questions.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  };

  // Previous Question
  const prevQuestion = () => {
    setActiveQuestion((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  };

  // Submit test
  const submitTest = async () => {
    const formData = {
      answers: Object.values(answers),
    };

    console.log(formData);
    setLoading("submitTest");
    try {
      const api = await getAxios();
      const res = await api.post(`/assessment/submit-test/${id}`, formData, {
        signal: controller.signal,
      });

      console.log(res);
      if (res.status == 200) {
        setShowTimeUp(false);
        setAssSubmited(res.data.data);
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setLoading(null);
        console.log(error);
        if (error?.message) {
          console.log(error?.response?.data?.message);
          if (error?.response?.status) {
            if (error?.response?.data?.message?.includes("ended")) {
              setShowExamClosed(true);
            }
          }
        }
      }
    }
  };

  // Submit pardon code
  const submitPardonCode = async () => {
    setLoading("pardon");
    try {
      const api = await getAxios();
      const res = await api.post("/assessment/unlock", {
        pardonCode,
        assessmentId: id,
      });
      if (res.data.status === "success") {
        violationCountRef.current = 0;
        setViolationCount(0);
        setServerBlocked(false);
        setPauseTime(false);
        setPardonCode("");
        securityMonitorRef.current?.reset();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid pardon code", {
        richColors: true,
      });
    } finally {
      setLoading(null);
    }
  };

  // Time up handler
  const handleTimeUp = () => {
    setShowTimeUp(true);
    submitTest();
  };

  // Unfocus radio buttons to avoid auto-select option on arrow key next
  const handleRadioFocus = () => {
    (document.activeElement as HTMLElement)?.blur();
  };

  // Update questions ref anytime it changes
  useEffect(() => {
    questionsRef.current = questions;
    activeQuestionRef.current = activeQuestion;
  }, [questions, activeQuestion]);

  // Keep ref updated for polling
  useEffect(() => {
    latestDataRef.current = { answers, timeLeft: globalTimeLeft };

    // Timer toasts messages
    if (globalTimeLeft === 300) {
      toast.warning("You have 5 minute remaining", {
        position: "bottom-right",
        richColors: true,
      });
    }

    if (globalTimeLeft === 60) {
      toast.warning("You have 1 minute remaining", {
        position: "bottom-right",
        richColors: true,
      });
    }
  }, [answers, globalTimeLeft]);

  // Time Control
  useEffect(() => {
    pauseTimeRef.current = pauseTime;
  }, [pauseTime]);

  // Page data fetching
  useEffect(() => {
    if (!session) return;
    isMounted.current = true;

    const getAssessment = async () => {
      try {
        const api = await getAxios();
        const draftRes = await api.get(`assessment/draft/${id}`, {
          signal: controller.signal,
        });
        const startRes = await api.post(`/assessment/start-test/${id}`, {
          signal: controller.signal,
        });

        let answeredQuestions: any;
        if (draftRes.status == 200) {
          if (draftRes?.data?.data?.draft) {
            examDurationRef.current = draftRes?.data?.data?.draft?.timeLeft;
            const formatted = draftRes?.data?.data?.draft?.data.reduce(
              (acc: any, item: any) => {
                acc[item.question] = {
                  question: item.question,
                  type: item.type,
                  ...(item.selectedOption && {
                    selectedOption: item.selectedOption,
                  }),
                  ...(item.theoryAnswer && {
                    theoryAnswer: item.theoryAnswer,
                  }),
                  ...(item.subjectiveAnswers && {
                    subjectiveAnswers: item.subjectiveAnswers,
                  }),
                };
                return acc;
              },
              {},
            );

            answeredQuestions = formatted;
            setAnswers(formatted);
          }
        }

        if (startRes.data.data.allowBrowserRestriction) {
          const violationsRes = await api.get(
            `/assessment/violations/${id}?studentId=${session!.user!.id}`,
            { signal: controller.signal },
          );
          const serverCount: number = Array.isArray(violationsRes.data.data)
            ? violationsRes.data.data.filter((v: any) => !v.isPardoned).length
            : (violationsRes.data.data?.count ?? 0);
          if (serverCount > 0) {
            violationCountRef.current = serverCount;
            setViolationCount(serverCount);
          }
          if (serverCount >= 1) {
            setServerBlocked(true);
            setPauseTime(true);
          }
        }

        if (startRes.status == 200) {
          setPageData(startRes.data.data);
          setQuestions(() => {
            // Question types eligible for shuffling
            // (e.g. ["multiple_choice", "theory"]).
            const shuffleSections: string[] = Array.isArray(
              startRes.data.data.shuffleQuestions,
            )
              ? startRes.data.data.shuffleQuestions
              : [];

            // Walk sections in order, keeping answered questions first within
            // each section and only shuffling the unanswered ones for sections
            // whose question type is listed in shuffleQuestions.
            return startRes.data.data.sections.reduce(
              (acc: any[], sct: any) => {
                const sectionQuestions: any[] = sct.questions ?? [];

                const canShuffle = shuffleSections.includes(
                  sectionQuestions[0]?.type,
                );

                const { answered, unanswered } = sectionQuestions.reduce(
                  (groups: { answered: any[]; unanswered: any[] }, q: any) => {
                    if (answeredQuestions && answeredQuestions[q._id]) {
                      groups.answered.push(q);
                    } else {
                      groups.unanswered.push(q);
                    }
                    return groups;
                  },
                  { answered: [], unanswered: [] },
                );

                acc.push(
                  ...answered,
                  ...(canShuffle ? shuffleArray(unanswered) : unanswered),
                );
                return acc;
              },
              [],
            );
          });

          setLoading(null);
        }
      } catch (error: any) {
        if (error?.name !== "CanceledError") {
          if (error?.message) {
            setPageError(error?.response?.data?.message);
          }
          setLoading("pageError");
          console.log(error);
        }

        if (error.name === "AxiosError") {
          setPageError(`An error has occured$${error.response.data.message}`);
        }
      }
    };

    let cancelled = false;

    const poll = async () => {
      if (!isMounted.current || cancelled) return;

      const formData = {
        answers: Object.values(latestDataRef.current.answers),
        timeLeft: latestDataRef.current.timeLeft,
      };

      setLoading("poll");
      try {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const api = await getAxios();

        if (
          Object.values(latestDataRef.current.answers).length < 1 ||
          latestDataRef.current.timeLeft === null
        ) {
          console.log(
            "Draft Save Cancelled: No data to save, Time not reading yet or time expired.",
          );
        } else if (!pauseTimeRef.current) {
          const res = await api.post(
            `assessment/submit-draft/${id}`,
            formData,
            {
              signal: abortRef.current.signal,
            },
          );
          socketRef.current &&
            socketRef.current.emit("progress-update", {
              assessmentId: id,
              studentId: session.user?.id,
              answered: Object.values(latestDataRef.current.answers).length,
              total: questionsRef.current?.length,
            });
          lastSavedRef.current = res?.data?.data?.lastSync;
        }
        setLoading(null);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Polling failed:", err);
        }
      } finally {
        if (isMounted.current && !cancelled) {
          timeoutRef.current = setTimeout(poll, 10_000);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;

      const key = event.key;

      if (key === "ArrowRight") return nextQuestion();
      if (key === "ArrowLeft") return prevQuestion();

      const qs = questionsRef.current;
      const index: number = activeQuestionRef.current;

      if (!qs) return;
      const q = qs[index];

      if (["A", "B", "C", "D", "a", "b", "c", "d"].includes(key)) {
        if (!questions) return;
        const upperKey = key.toUpperCase();
        setAnswers((prev) => {
          if (q.type === "multiple_select") {
            const prevEntry = prev[q._id];
            const prevSelected = prevEntry?.selectedOptions ?? [];
            const nextSelected = prevSelected.includes(upperKey)
              ? prevSelected.filter((l) => l !== upperKey)
              : [...prevSelected, upperKey];
            if (nextSelected.length === 0) {
              const { [q._id]: _, ...rest } = prev;
              return rest;
            }
            return {
              ...prev,
              [q._id]: {
                ...prevEntry,
                question: q._id,
                type: q.type,
                selectedOptions: nextSelected,
              },
            };
          }
          return {
            ...prev,
            [q._id]: {
              question: q._id,
              type: q.type,
              selectedOption: upperKey,
            },
          };
        });
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    const handlePopState = () => {
      const confirmed = window.confirm(
        "Are you sure you want to leave? Your exam progress may be lost.",
      );
      if (!confirmed) window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);

    !pageData && getAssessment();
    pageData && poll();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      cancelled = true;
      controller.abort();
      isMounted.current = false;
      timeoutRef.current && clearTimeout(timeoutRef.current);
      abortRef.current?.abort();

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [session, pageData]);

  // Web Sockets
  useEffect(() => {
    if (socketRef.current) return;
    if (!session?.user?.id) return;

    let cancelled = false;

    const initSocket = async () => {
      const res = await fetch(`${window.location.origin}/api/config`);
      const { clientApiUrl } = await res.json();
      const socketUrl = new URL(clientApiUrl).origin;

      if (cancelled || socketRef.current) return;

      const socket = io(socketUrl, {
        path: "/socket.io",
        transports: ["websocket"],
        query: {
          token: `Bearer ${session?.user?.token}`,
        },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Connected to socket");
        socket.emit("join-assessment", {
          assessmentId: id,
          studentId: session?.user?.id,
          name: session?.user?.fullName ?? "",
        });
      });

      socket.on("connect_error", (err) => {
        console.error("[ExamSocket] connection error:", err.message);
      });

      socket.on("unlock", () => {
        violationCountRef.current = 0;
        setViolationCount(0);
        setPauseTime(false);
        setPardonCode("");
        setServerBlocked(false);
      });

      socket.io.on("reconnect", () => {
        socket.emit("join-assessment", {
          assessmentId: id,
          studentId: session?.user?.id,
          name: session?.user?.fullName ?? "",
        });
      });
    };

    initSocket();

    return () => {
      cancelled = true;
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        if (socket.connected) {
          socket.disconnect();
        } else {
          socket.once("connect", () => socket.disconnect());
        }
      }
    };
  }, [session?.user?.id, id]);

  return (
    <>
      {pageData && questions && (
        <SecurityMonitor
          ref={securityMonitorRef}
          key={serverBlocked ? "blocked" : "free"}
          maxViolations={pageData.allowBrowserRestriction ? 4 : undefined}
          disableRightClick={pageData.allowBrowserRestriction}
          disableClipboard={pageData.allowBrowserRestriction}
          onViolation={(v) => {
            if (!pageData.allowBrowserRestriction) return;
            if (violationCountRef.current > 4) return;

            violationCountRef.current += 1;
            const next = violationCountRef.current;
            setViolationCount(next);

            if (next === 4) {
              setPauseTime(true);
              socketRef.current?.emit("suspicious-activity", {
                assessmentId: id,
                studentId: session?.user?.id,
                type: v.type,
                violation: next,
              });
            }
          }}
          initialBlocked={serverBlocked}
          onDismiss={violationCount >= 4 || serverBlocked ? null : undefined}
          pardonSlot={
            violationCount >= 4 || serverBlocked ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500 text-center">
                  Enter the pardon code from your administrator to continue.
                </p>
                <input
                  type="text"
                  className="border w-full px-3 py-2 rounded-lg outline-none text-sm"
                  placeholder="Enter pardon code"
                  value={pardonCode}
                  onChange={(e) => setPardonCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && pardonCode.trim())
                      submitPardonCode();
                  }}
                />
                <button
                  onClick={submitPardonCode}
                  disabled={!pardonCode.trim() || loading === "pardon"}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {loading === "pardon" ? "Unlocking..." : "Unlock Exam"}
                </button>
              </div>
            ) : undefined
          }
          blockOn={
            pageData.allowBrowserRestriction
              ? [
                  "TAB_SWITCH",
                  "KEYBOARD_SHORTCUT",
                  "COPY",
                  "CUT",
                  "PASTE",
                  "FULLSCREEN_EXIT",
                ]
              : []
          }
        >
          {!assSubmited && (
            <div className="relative grow grid grid-cols-12 min-h-full px-4 sm:px-5 font-sans">
              {/* Main Bar */}
              <div className="h-full col-span-12 lg:col-span-9 flex flex-col justify-between lg:border-r lg:pr-5 pt-5">
                {/* Upper Content */}
                <div className="">
                  {/* Heading & Submit */}
                  <div className="flex  sm:flex-row sm:h-14 border-b justify-between gap-3 sm:gap-5 pb-3 sm:pb-0">
                    {/* Heading */}
                    <div className="grow ">
                      <div className="text-lg sm:text-xl font-semibold leading-snug font-serif">
                        {pageData?.title}
                      </div>
                      <div className="text-theme-gray text-sm">
                        {pageData?.course?.title}
                      </div>
                    </div>

                    {/* Submit & Save Button */}
                    <div className="flex items-center gap-2 w-32 lg:w-fit">
                      {/* Calculator Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowCalculator((prev) => !prev)}
                        aria-label="Toggle calculator"
                        title="Calculator"
                        className={`flex h-12 lg:h-10 w-12 lg:w-10 shrink-0 items-center justify-center rounded-lg borders transition cursor-pointer ${
                          showCalculator
                            ? "border-accent bg-accent-light text-accent-dim"
                            : "border-accent/25 text-accent-dim hover:bg-accent-light"
                        }`}
                      >
                        <CalculatorIcon size={26} />
                      </button>

                      {/* Update Status — hidden on mobile to save space */}
                      <div className="hidden sm:flex border-l h-10 w-48 text-sm items-center text-theme-gray justify-center gap-2 shrink-0">
                        <CloudCheck size={20} className="mb-0.5" />
                        <span>
                          Last Saved
                          {lastSavedRef.current
                            ? " (" +
                              lastSavedRef.current
                                ?.split("T")[1]
                                .split(".")[0]
                                .slice(0, -3) +
                              ")"
                            : ""}
                        </span>
                      </div>

                      {/* Submit Button */}
                      <div className="w-full sm:w-42">
                        <Button
                          type="button"
                          onClick={() => setShowEndExam(true)}
                          title="Submit Exam"
                          icon={<Check size={16} />}
                          loading={false}
                          variant="fill"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile: Timer strip — visible only on mobile, below header */}
                  <div className="flex lg:hidden items-center gap-2 text-black/80 border-b py-3 mt-1">
                    <Clock4 size={24} strokeWidth="2.5" />
                    <div>
                      <div className="text-xs leading-none text-theme-gray">
                        Your Time
                      </div>
                      <div className="text-lg font-extrabold leading-none">
                        <Counter
                          durationInSeconds={
                            examDurationRef.current !== null &&
                            examDurationRef.current !== 0
                              ? examDurationRef.current
                              : Number(pageData.timeLimit * 60) // get durationn from pageData & convert sec.
                          }
                          onComplete={handleTimeUp}
                          timeLeftParams={{ globalTimeLeft, setGlobalTimeLeft }}
                          timePaused={pauseTime}
                        />
                      </div>
                    </div>
                  </div>

                  <Spacer size="md" />

                  {/* Question Content & Image */}
                  <div className="flex items-start gap-2">
                    {/* Questions */}
                    <div className="grow h-fit">
                      {/* Question */}
                      <div className="min-h-15">
                        {/* Non-subjective Question */}
                        {questions[activeQuestion]?.type !== "subjective" && (
                          <div className="flex text-base">
                            {/* Question Number */}
                            <div className="w-10 sm:w-12 h-fit shrink-0 font-semibold underline">
                              Q{activeQuestion + 1}.
                            </div>

                            {/* Question Text */}
                            <div className="grow">
                              {questions[activeQuestion].question}
                            </div>
                          </div>
                        )}

                        {/* Subjective Question */}
                        {questions[activeQuestion]?.type == "subjective" && (
                          <div className="flex">
                            {/* Question Number */}
                            <div className="w-10 sm:w-12 h-fit shrink-0 font-semibold underline">
                              Q{activeQuestion + 1}.
                            </div>

                            <p className="text-base leading-2">
                              {parts(questions[activeQuestion].question).map(
                                (part, index) => {
                                  if (part.match(/\[\d+\]/)) {
                                    return (
                                      <input
                                        key={index}
                                        type="text"
                                        value={
                                          index < 3
                                            ? answers[
                                                `${questions[activeQuestion]._id}`
                                              ]?.subjectiveAnswers?.[index - 1]
                                                ?.answer || ""
                                            : answers[
                                                `${questions[activeQuestion]._id}`
                                              ]?.subjectiveAnswers?.[index - 2]
                                                ?.answer || ""
                                        }
                                        onChange={(e) =>
                                          setAnswers((prev) => {
                                            console.log(index);
                                            const qstRef =
                                              questions[activeQuestion];
                                            const prevEntry = prev[qstRef._id];

                                            const updatedSlots =
                                              prevEntry?.subjectiveAnswers
                                                ? [
                                                    ...prevEntry.subjectiveAnswers,
                                                  ]
                                                : [];

                                            if (index < 3) {
                                              updatedSlots[index - 1] = {
                                                slotNumber: index,
                                                answer: e.target.value,
                                              };
                                            } else {
                                              updatedSlots[index - 2] = {
                                                slotNumber: index - 1,
                                                answer: e.target.value,
                                              };
                                            }

                                            console.log(updatedSlots);

                                            return {
                                              ...prev,
                                              [qstRef._id]: {
                                                ...prevEntry,
                                                question: qstRef._id,
                                                type: qstRef.type,
                                                subjectiveAnswers: updatedSlots,
                                              },
                                            };
                                          })
                                        }
                                        className="h-5"
                                        style={{
                                          width: "140px",
                                          margin: "0 5px",
                                          border: "none",
                                          borderBottom: "1px solid black",
                                          outline: "none",
                                        }}
                                      />
                                    );
                                  }

                                  return (
                                    <span
                                      key={index}
                                      className="leading-relaxed"
                                    >
                                      {part}
                                    </span>
                                  );
                                },
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                      <Spacer size="sm" />

                      {/* Objective Options */}
                      {questions[activeQuestion]?.type == "multiple_choice" && (
                        <RadioGroup
                          value={
                            answers[`${questions[activeQuestion]._id}`]
                              ?.selectedOption || ""
                          }
                          onValueChange={(val) =>
                            setAnswers((prev) => {
                              return {
                                ...prev,
                                [questions[activeQuestion]._id]: {
                                  question: questions[activeQuestion]._id,
                                  type: questions[activeQuestion].type,
                                  selectedOption: val,
                                },
                              };
                            })
                          }
                          onFocus={handleRadioFocus}
                        >
                          {questions[activeQuestion].options.map(
                            (opt: any, key: number) => {
                              return (
                                <div
                                  className="flex items-start gap-4 mb-2"
                                  key={key}
                                >
                                  <RadioGroupItem
                                    value={opt.label}
                                    id={`r${key + 1}`}
                                    className="cursor-pointer shrink-0 mt-1 lg:mt-1"
                                  />

                                  <label
                                    htmlFor={`r${key + 1}`}
                                    className="flex items-start gap-2 select-none cursor-pointer text-base"
                                  >
                                    <span className="font-bold text-base">{`[${opt.label}]`}</span>
                                    <span>{opt.text}</span>
                                  </label>
                                </div>
                              );
                            },
                          )}
                        </RadioGroup>
                      )}

                      {/* Multiple Select Options */}
                      {questions[activeQuestion]?.type == "multiple_select" && (
                        <div className="flex flex-col">
                          {questions[activeQuestion].options.map(
                            (opt: any, key: number) => {
                              const selected =
                                answers[`${questions[activeQuestion]._id}`]
                                  ?.selectedOptions ?? [];
                              const isChecked = selected.includes(opt.label);
                              return (
                                <div
                                  className="flex items-center gap-4 mb-2"
                                  key={key}
                                >
                                  <Checkbox
                                    id={`ms${key + 1}`}
                                    checked={isChecked}
                                    className="cursor-pointer shrink-0"
                                    onCheckedChange={(checked) => {
                                      setAnswers((prev) => {
                                        const qstRef =
                                          questions[activeQuestion];
                                        const prevEntry = prev[qstRef._id];
                                        const prevSelected =
                                          prevEntry?.selectedOptions ?? [];
                                        const nextSelected = checked
                                          ? [...prevSelected, opt.label]
                                          : prevSelected.filter(
                                              (l) => l !== opt.label,
                                            );
                                        if (nextSelected.length === 0) {
                                          const { [qstRef._id]: _, ...rest } =
                                            prev;
                                          return rest;
                                        }
                                        return {
                                          ...prev,
                                          [qstRef._id]: {
                                            ...prevEntry,
                                            question: qstRef._id,
                                            type: qstRef.type,
                                            selectedOptions: nextSelected,
                                          },
                                        };
                                      });
                                    }}
                                  />
                                  <label
                                    htmlFor={`ms${key + 1}`}
                                    className="flex items-center gap-2 select-none cursor-pointer text-base"
                                  >
                                    <span className="font-bold text-base">{`[${opt.label}]`}</span>
                                    <span>{opt.text}</span>
                                  </label>
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}

                      {/* Theory Options */}
                      {questions[activeQuestion].type == "theory" && (
                        <textarea
                          className="border w-full min-h-36 sm:min-h-42 max-h-42 px-4 py-4 rounded-md outline-none text-base"
                          placeholder="Type your answer"
                          value={
                            answers[`${questions[activeQuestion]._id}`]
                              ?.theoryAnswer || ""
                          }
                          onChange={(e) =>
                            setAnswers((prev) => {
                              const qstRef = questions[activeQuestion];
                              const prevEntry = prev[qstRef._id];

                              return {
                                ...prev,
                                [qstRef._id]: {
                                  ...prevEntry,
                                  question: questions[activeQuestion]._id,
                                  type: questions[activeQuestion].type,
                                  theoryAnswer: e.target.value,
                                },
                              };
                            })
                          }
                        ></textarea>
                      )}
                    </div>

                    {/* Question Image */}
                    {questions[activeQuestion]?.images &&
                      questions[activeQuestion]?.images.length > 0 && (
                        <div className="flex w-[40%] shrink-0">
                          <Image
                            src={questions[activeQuestion].images[0]}
                            alt="Question Image"
                            className="w-full object-contain"
                            width={100}
                            height={100}
                          />
                        </div>
                      )}
                  </div>
                </div>

                {/* Footer Content */}
                <div className="mb-6 sm:mb-10 flex items-center gap-3 sm:gap-4 mt-6">
                  {/* Prev Button */}
                  <div className="w-20 sm:w-24 shrink-0">
                    <Button
                      title="Previous"
                      variant="fill"
                      type="button"
                      loading={false}
                      onClick={prevQuestion}
                    />
                  </div>

                  {/* Question Counter */}
                  <div className="flex items-center justify-center gap-2 grow text-xs sm:text-base text-center">
                    {`Q ${activeQuestion + 1} / ${questions.length}`}
                  </div>

                  {/* Next Button */}
                  <div className="w-20 sm:w-24 shrink-0">
                    <Button
                      title="Next"
                      variant="fill"
                      type="button"
                      loading={false}
                      icon={<ChevronRightIcon size={16} />}
                      onClick={nextQuestion}
                    />
                  </div>
                </div>
              </div>

              {/* SideBar — hidden on mobile, shown on lg+ */}
              <div className="hidden lg:flex col-span-3 flex-col pl-5 pt-5 -mr-5">
                {/* Time Counter */}
                <div className="flex h-14 items-center gap-2 text-black/80 border-b w-full">
                  <Timer
                    size={38}
                    className={`${globalTimeLeft && globalTimeLeft < 300 ? "text-theme-warning" : ""}`}
                  />
                  <div className="text-2xl font-extrabold leading-none mt-1">
                    <Counter
                      durationInSeconds={
                        examDurationRef.current !== null &&
                        examDurationRef.current !== 0
                          ? examDurationRef.current
                          : Number(pageData.timeLimit * 60)
                      }
                      onComplete={handleTimeUp}
                      timeLeftParams={{ globalTimeLeft, setGlobalTimeLeft }}
                      timePaused={pauseTime}
                    />
                  </div>
                </div>
                <Spacer size="md" />

                {/* Profile Picture */}
                <div className="h-62.5 w-62.5 flex items-center justify-center self-center bg-theme-gray-light rounded-md overflow-hidden">
                  {!session?.user?.passportPhoto ? (
                    <User2
                      size={200}
                      strokeWidth={0.5}
                      className="text-theme-gray-mid"
                    />
                  ) : (
                    <Image
                      src={session?.user?.passportPhoto}
                      alt="Profile photo"
                      height={250}
                      width={250}
                    />
                  )}
                </div>
                <Spacer size="md" />

                {/* Registration Number */}
                <div className="border-b pb-2">
                  <div className="text-sm text-theme-gray">
                    Registration Number
                  </div>
                  <div>{session?.user?.regNumber}</div>
                </div>
                <Spacer size="sm" />

                {/* Full Name */}
                <div className="pb-2 border-b">
                  <div className="text-sm text-theme-gray">Full Name</div>
                  <div>{session?.user?.fullName}</div>
                </div>
                <Spacer size="sm" />

                {/* Level */}
                <div className="pb-2">
                  <div className="text-sm text-theme-gray">Level</div>
                  <div>{session?.user?.level}</div>
                </div>
              </div>

              {/* Questions Overview — hidden on mobile (lives in left gutter on desktop) */}
              <div className="hidden lg:block absolute top-0 -left-[20vw] w-[20vw] mt-32 p-5">
                <div className="text-sm text-accent-dim">
                  Answered Questions{" "}
                  {`(${Object.keys(answers).length}/${questions.length})`}
                </div>
                <Spacer size="sm" />
                <div className="flex flex-wrap gap-2 overflow-y-scroll max-h-[60vh]">
                  {questions.map((qst, key) => (
                    <button
                      type="button"
                      key={key}
                      className={`h-5 w-5 flex items-center justify-center text-xs font-semibold
                        ${
                          answers[`${qst._id}`] && key !== activeQuestion
                            ? "bg-accent-dim text-white"
                            : "border border-dashed border-accent-light text-accent"
                        }
                        ${
                          activeQuestion === key
                            ? "border border-theme-success bg-transparent text-theme-success"
                            : ""
                        }
                        rounded-sm cursor-pointer`}
                      onClick={() => setActiveQuestion(key)}
                    >
                      {key + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculator */}
              {showCalculator && (
                <Calculator onClose={() => setShowCalculator(false)} />
              )}

              {/* Dialog - End Exam */}
              <Dialog open={showEndExam} onOpenChange={setShowEndExam}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="hidden">End Exam</DialogTitle>
                    <DialogDescription className="hidden">
                      you are about to end exams
                    </DialogDescription>
                  </DialogHeader>

                  <div className="w-full flex flex-col items-center mt-10">
                    <CircleQuestionMark size={82} className="text-accent-dim" />

                    <div className="text-2xl sm:text-3xl text-accent-dim font-semibold">
                      Are you sure?
                    </div>
                    <Spacer size="xl" />

                    <div className="flex items-center gap-4">
                      <div className="w-36 sm:w-38">
                        <Button
                          title={"No, Go back"}
                          loading={loading === "submitAss"}
                          variant={"outline"}
                          onClick={() => setShowEndExam(false)}
                        />
                      </div>

                      <div className="w-36 sm:w-38">
                        <Button
                          title={"Yes, Submit"}
                          loading={loading == "submitTest"}
                          variant={"fill"}
                          icon={<ArrowRight size={14} />}
                          onClick={submitTest}
                        />
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Dialog - Auto end exam */}
              <Dialog open={showTimeUp} onOpenChange={setShowTimeUp}>
                <DialogContent
                  className="overflow-hidden"
                  onPointerDownOutside={(e) => e.preventDefault()}
                  onEscapeKeyDown={(e) => e.preventDefault()}
                >
                  <DialogClose className="hidden"></DialogClose>
                  <DialogHeader>
                    <DialogTitle className="hidden">
                      Your time has elapsed
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      you are about to end exams
                    </DialogDescription>
                  </DialogHeader>

                  <div className="w-full flex flex-col items-center mt-10">
                    <Clock2Icon size={82} className="text-accent-dim" />

                    <div className="text-2xl sm:text-3xl text-accent-dim font-semibold">
                      Your time is up!
                    </div>
                    <Spacer size="xl" />

                    <div className="flex items-center gap-4">
                      <div className="w-36 sm:w-38">
                        <Button
                          title={
                            loading === "submitTest"
                              ? "Submitting Exam"
                              : "Submit Exam"
                          }
                          loading={loading == "submitTest"}
                          variant={"fill"}
                          icon={<ArrowRight size={14} />}
                          onClick={submitTest}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="absolute h-20 w-20 bg-white top-0 right-0 z-10"></div>
                </DialogContent>
              </Dialog>

              {/* Dialog - Submission on exam closed */}
              <Dialog open={showExamClosed} onOpenChange={setShowExamClosed}>
                <DialogContent
                  className="overflow-hidden"
                  onPointerDownOutside={(e) => e.preventDefault()}
                  onEscapeKeyDown={(e) => e.preventDefault()}
                >
                  <DialogClose className="hidden"></DialogClose>
                  <DialogHeader>
                    <DialogTitle className="hidden">
                      This Exam has Ended
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      You can no longer submit, your saved entries will be
                      recorded
                    </DialogDescription>
                  </DialogHeader>

                  <div className="w-full flex flex-col items-center mt-10">
                    <Clock2Icon size={82} className="text-accent-dim" />

                    <div className="text-2xl sm:text-3xl text-accent-dim font-semibold">
                      Exam has ended
                    </div>
                    <Spacer size="md" />

                    <div className="text-sm text-theme-gray text-center px-5">
                      The admin ended exams while you were writing, your entries
                      will be saved up to the time the exam was ended. Contact
                      your administrator.
                    </div>
                    <Spacer size="xl" />

                    <div className="flex items-center gap-4">
                      <div className="w-full sm:w-48">
                        <Button
                          title={"Go Back to Dashboard"}
                          loading={loading == "submitTest"}
                          variant={"fill"}
                          icon={<ArrowRight size={14} />}
                          onClick={() => {
                            router.push("/exams");
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="absolute h-20 w-20 bg-white top-0 right-0 z-10"></div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {assSubmited && (
            <div className="relative h-full grow grid grid-cols-12 min-h-full px-4 sm:px-10 font-sans">
              <div className="col-span-12 h-full flex flex-col items-center justify-center -mt-5 px-4">
                <div className="bg-accent-light rounded-full p-8 sm:p-10">
                  <Check
                    size={72}
                    strokeWidth={2.5}
                    className="text-accent sm:w-24.5 sm:h-24.5"
                  />
                </div>
                <Spacer size="lg" />

                <div className="text-2xl sm:text-4xl font-bold text-accent-dim text-center">
                  Exams Submitted!
                </div>

                <div className="text-black/80 hidden">
                  Please logout or return to your dashboard
                </div>

                <div className="hidden w-3/10 border-y py-2 text-black/80">
                  <div className="flex items-end justify-center gap-2 full mb-1">
                    <div>Auto Marked Questions:</div>
                    <div>{assSubmited?.autoMarked}</div>
                  </div>

                  <div className="flex items-end justify-center gap-2 full">
                    <div>Pending Questions:</div>
                    <div>{assSubmited?.pending}</div>
                  </div>
                </div>

                <div className="hidden flexs gap-2 text-accent-dim">
                  <div className="text-2xl font-bold">Total Score:</div>
                  <div className="text-2xl">
                    {assSubmited?.totalScore}/{pageData?.totalMarks}
                  </div>
                </div>
                <Spacer size="xl" />

                <div className="w-full sm:w-72">
                  <Button
                    title={"Return to my Dashboard"}
                    loading={false}
                    variant={"fill"}
                    icon={<ArrowRight size={14} />}
                    onClick={() => router.push("/exams")}
                  />
                </div>
              </div>
            </div>
          )}
        </SecurityMonitor>
      )}

      <Preload
        loading={loading}
        pageData={pageData ? true : false}
        errorMessage={pageError}
      />
    </>
  );
};

const PageWrapper = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  return (
    <SessionProvider>
      <Page id={id} />
    </SessionProvider>
  );
};

export default PageWrapper;
