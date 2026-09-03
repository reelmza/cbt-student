"use client";

import {
  ArrowRight,
  Check,
  ChevronRightIcon,
  CircleQuestionMark,
  Clock2Icon,
  Clock4,
  CloudCheck,
  Expand,
  Info,
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
import Counter from "@/components/counter";
import ExamTools from "@/components/exam-tools";
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
import { prettyDate } from "@/lib/dateFormater";
import shuffleArray from "@/utils/array-shuffler";

const OBJECTIVE_TYPES = ["multiple_choice", "multiple_select"];

// The letter a student sees comes from the option's position, not from
// opt.label. Shuffling therefore only reorders the array: every option keeps
// its original label, and that label is what gets stored in `answers` and sent
// to the server, so marking is unaffected by the order options appear in.
// Option order follows the same shuffleQuestions config as question order.
const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const shuffleOptions = (question: any) => {
  if (!OBJECTIVE_TYPES.includes(question?.type)) return question;
  if (!Array.isArray(question.options) || question.options.length < 2) {
    return question;
  }
  return { ...question, options: shuffleArray(question.options) };
};

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

  // Modal States
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const previewImageRef = useRef<string | null>(null);
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

  // The first array entry holds one or two urls, comma separated
  const questionImages =
    questions?.[activeQuestion]?.images?.[0]
      ?.split(",")
      .map((url) => url.trim())
      .filter(Boolean) ?? [];

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

  // Mirrored into a ref so the keydown listener can read it without being
  // torn down and re-registered every time the preview opens or closes.
  useEffect(() => {
    previewImageRef.current = previewImage;
  }, [previewImage]);

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

                // Already answered questions keep both their position and
                // their option order, so a resumed exam looks unchanged.
                acc.push(
                  ...answered,
                  ...(canShuffle
                    ? shuffleArray(unanswered).map(shuffleOptions)
                    : unanswered),
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
          // 401 — session expired or the account is being used elsewhere.
          // Show the logout screen with a clear message (the 401 body is
          // empty, so provide our own friendly copy).
          if (error?.response?.status === 401) {
            setPageError(
              "Your Session Has Expired$Please login again to continue.",
            );
            setLoading("pageError");
            return;
          }

          // 403 — the administrator has not authorized the assessment to
          // start yet. Show a friendly, non-error info screen (no logout).
          if (error?.response?.status === 403) {
            setPageError(
              error?.response?.data?.message ||
                "This assessment has not been opened by your administrator yet.",
            );
            setLoading("notAuthorized");
            return;
          }

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
          timeoutRef.current = setTimeout(poll, 40_000);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;

      // While an image is enlarged, arrow keys and option keys would act on
      // the question hidden behind the modal, so ignore them entirely.
      if (previewImageRef.current) return;

      const key = event.key;

      if (key === "ArrowRight") return nextQuestion();
      if (key === "ArrowLeft") return prevQuestion();

      const qs = questionsRef.current;
      const index: number = activeQuestionRef.current;

      if (!qs) return;
      const q = qs[index];

      if (["A", "B", "C", "D", "a", "b", "c", "d"].includes(key)) {
        if (!questions) return;

        // The key names a display position; resolve it to the option actually
        // sitting there, since shuffling moves labels away from their slot.
        const pressedLabel =
          q.options?.[OPTION_LABELS.indexOf(key.toUpperCase())]?.label;
        if (!pressedLabel) return;
        const upperKey = pressedLabel;

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
            <div className="relative grow grid grid-cols-12 h-full min-h-0 px-4 sm:px-5 font-sans">
              {/* Main Bar */}
              <div className="h-full min-h-0 col-span-12 lg:col-span-9 flex flex-col lg:pr-5 pt-5">
                {/* Upper Content — pinned, never scrolls */}
                <div className="shrink-0">
                  {/* Heading & Submit */}
                  <div className="h-14 bg-s flex sm:flex-row border-b justify-between gap-3 p-3">
                    {/* Heading */}
                    <div className="grow flex flex-col -mt-1">
                      <div className="text-lg sm:text-xl font-semibold leading-tight font-serif">
                        {pageData?.title}
                      </div>
                      <div className="text-theme-gray text-xs">
                        {pageData?.course?.title}
                      </div>
                    </div>

                    {/* Submit & Save Button */}
                    <div className="flex items-center gap-2 w-32 lg:w-fit">
                      {/* Update Status — hidden on mobile to save space */}
                      <div className="hidden sm:flex h-10 w-fit pr-5 text-sm items-center text-theme-gray justify-center gap-2 shrink-0">
                        <CloudCheck size={20} className="mb-0.5" />
                        <span>
                          Saved
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

                      {/* Exam Tools — calculator, periodic table, etc. */}
                      <ExamTools />

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

                </div>

                {/* Scroll Region — the only scrollable area on the page.
                    Laid out as a column so the question block can absorb any
                    leftover height and hold the nav footer at the bottom. */}
                <div className="grow min-h-0 overflow-y-auto flex flex-col pt-4">
                  {/* Question Content & Image */}
                  <div className="grow shrink-0 flex items-start gap-2">
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
                                    <span className="font-bold text-base">{`[${OPTION_LABELS[key] ?? opt.label}]`}</span>
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
                                    <span className="font-bold text-base">{`[${OPTION_LABELS[key] ?? opt.label}]`}</span>
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

                    {/* Question Image(s) */}
                    {questionImages.length > 0 && (
                      <div className="flex flex-col gap-2 w-[40%] shrink-0">
                        {questionImages.map((img, key) => (
                          <button
                            key={img}
                            type="button"
                            title="Click to view full size"
                            aria-label={`View question image ${key + 1} full size`}
                            onClick={() => setPreviewImage(img)}
                            className="group relative w-full cursor-zoom-in overflow-hidden rounded-md"
                          >
                            <Image
                              src={img}
                              alt={`Question Image ${key + 1}`}
                              className="w-full object-contain"
                              width={100}
                              height={100}
                            />

                            {/* Affordance — the thumbnail is too narrow to
                                show detail on wide images */}
                            <span className="pointer-events-none absolute right-1.5 bottom-1.5 flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                              <Expand size={12} />
                              View
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Content — sits at the bottom of the main bar when
                      the question is short, and scrolls with it when long */}
                  <div className="shrink-0 mb-6 sm:mb-10 flex items-center gap-3 sm:gap-4 mt-6">
                  {/* Prev Button */}
                  <div className="w-20 sm:w-24 shrink-0">
                    <Button
                      title="Previous"
                      variant="white"
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
                      variant="white"
                      type="button"
                      loading={false}
                      icon={<ChevronRightIcon size={16} />}
                      onClick={nextQuestion}
                    />
                    </div>
                  </div>
                </div>
              </div>

              {/* SideBar — hidden on mobile, shown on lg+ */}
              <div className="hidden lg:flex col-span-3 flex-col pl-5 pt-5 h-full min-h-0 overflow-y-auto">
                <div className="flex flex-wrap items-start gap-4 lg:flex-col bg-white border rounded-xl overflow-hidden h-fit">
                  {/* Time Counter — pinned to the top of the sidebar */}
                  <div className="w-full flex h-14 shrink-0 items-center gap-2 px-5 text-black/80 border-b">
                    <Timer
                      size={30}
                      className={`${globalTimeLeft && globalTimeLeft < 300 ? "text-theme-warning" : ""}`}
                    />
                    <div className="text-2xl font-extrabold leading-none mt-0.5">
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

                  {/* Profile Picture */}
                  <div className="h-22 w-22 lg:h-52 lg:w-full flex flex-col items-center justify-center lg:self-center overflow-hidden shrink-0 border-b">
                    {!session?.user?.passportPhoto ? (
                      <>
                        <User2
                          size={120}
                          strokeWidth={0.2}
                          className="text-theme-gray-mid"
                        />
                        <span className="text-xs text-theme-gray italic mt-2">
                          Photo not uploaded
                        </span>{" "}
                      </>
                    ) : (
                      <Image
                        src={session?.user?.passportPhoto}
                        alt="Profile photo"
                        className="object-cover aspect-square"
                        height={250}
                        width={250}
                      />
                    )}
                  </div>

                  {/* User details */}
                  <div className="grow lg:w-full flex flex-col lg:gap-y-2">
                    {/* Registration Number */}
                    <div className="px-5 py-2 text-theme-gray text-sm">
                      {/* Reg Number */}
                      <div className="text-xs font-light">
                        Registration Number
                      </div>
                      <div className="font-semibold">
                        {session?.user?.regNumber}
                      </div>
                      <Spacer size="md" />

                      {/* Full Name */}
                      <div className="text-xs font-light">Full Name</div>
                      <div className="font-semibold">
                        {session?.user?.fullName}
                      </div>
                      <Spacer size="md" />

                      {/* Level*/}
                      <div className="text-xs font-light">Level</div>
                      <div className="font-semibold">
                        {session?.user?.level}
                      </div>
                      <Spacer size="md" />

                      {/* User ID*/}
                      <div className="text-xs font-light">User Id</div>
                      <div className="font-semibold">
                        /{session?.user?.id?.slice(-8)}
                      </div>
                      <Spacer size="md" />

                      {/* Session */}
                      <div className="text-xs font-light">Session</div>
                      <div className="font-semibold">
                        {session?.expires && prettyDate(session?.expires)}
                      </div>
                      <Spacer size="md" />
                    </div>
                  </div>
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

              {/* Dialog - Image preview. Closes on the X, on the backdrop, or
                  on the image itself, so a student never needs Escape — that
                  key drops the browser out of fullscreen and would trip a
                  FULLSCREEN_EXIT violation. */}
              <Dialog
                open={previewImage !== null}
                onOpenChange={(open) => !open && setPreviewImage(null)}
              >
                <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-[95vw] p-3">
                  <DialogHeader>
                    <DialogTitle className="hidden">Question image</DialogTitle>
                    <DialogDescription className="hidden">
                      Enlarged view of the current question image
                    </DialogDescription>
                  </DialogHeader>

                  {previewImage && (
                    <button
                      type="button"
                      aria-label="Close image"
                      onClick={() => setPreviewImage(null)}
                      className="relative h-[82vh] w-full cursor-zoom-out"
                    >
                      <Image
                        src={previewImage}
                        alt="Question image, full size"
                        fill
                        sizes="95vw"
                        className="object-contain"
                      />
                    </button>
                  )}
                </DialogContent>
              </Dialog>

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
                          title={"Return to Dashboard"}
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
                    title={"Return to Dashboard"}
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

      {/* Friendly info screen — assessment not yet authorized to start (403) */}
      {loading === "notAuthorized" && (
        <div className="grow h-full flex flex-col items-center justify-center px-4 font-sans">
          <div className="bg-accent-light rounded-full p-8 sm:p-10">
            <Info
              size={72}
              strokeWidth={1.8}
              className="text-accent sm:w-24 sm:h-24"
            />
          </div>
          <Spacer size="lg" />

          <div className="text-2xl sm:text-3xl font-bold text-accent-dim text-center">
            Assessment not open yet
          </div>
          <Spacer size="sm" />

          <div className="text-sm text-theme-gray text-center max-w-md">
            {pageError ||
              "Your administrator has not authorized this assessment to start yet. Please check back shortly."}
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
      )}

      {loading !== "notAuthorized" && (
        <Preload
          loading={loading}
          pageData={pageData ? true : false}
          errorMessage={pageError}
        />
      )}
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
