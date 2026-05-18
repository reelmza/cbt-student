"use client";
import Button from "@/components/button";
import Counter from "@/components/counter";

import Spacer from "@/components/spacer";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, localAxios } from "@/lib/axios";
import shuffleArray from "@/utils/array-shuffler";

import {
  ArrowRight,
  Check,
  ChevronRightIcon,
  CircleQuestionMark,
  CircleSmall,
  Clock2Icon,
  Clock4,
  CloudCheck,
  User2,
} from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { SecurityMonitor } from "@/components/security-monitor";
import Preload from "@/components/preload";

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

  const [showEndExam, setShowEndExam] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [showExamClosed, setShowExamClosed] = useState(false);

  const [timeLeftX, setTimeLeftX] = useState<number | null>(null);

  // Poll
  const lastSavedRef = useRef<string | null>(null);
  const latestDataRef = useRef({ answers, timeLeft: timeLeftX });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);
  const examDurationRef = useRef<number | null>(null);

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
      // If active question is not the last
      if (questions && prev < questions.length - 1) {
        return prev + 1;
      }

      // Else do nothing
      return prev;
    });
  };

  // Previous Quesion
  const prevQuestion = () => {
    setActiveQuestion((prev) => {
      // If active question is not the first
      if (prev > 0) {
        return prev - 1;
      }

      // Else do nothing
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
      attachHeaders(session!.user!.token);
      const res = await localAxios.post(
        `/assessment/submit-test/${id}`,
        formData,
        {
          signal: controller.signal,
        }
      );

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

  // Time up handler
  const handleTimeUp = () => {
    setShowTimeUp(true);
    submitTest();
  };

  // Unfocus radio buttons to avoid auto-select option on arrow key next
  const handleRadioFocus = () => {
    (document.activeElement as HTMLElement)?.blur();
  };

  useEffect(() => {
    questionsRef.current = questions;
    activeQuestionRef.current = activeQuestion;
  }, [questions, activeQuestion]);

  // Keep ref updated for polling
  useEffect(() => {
    latestDataRef.current = { answers, timeLeft: timeLeftX };
  }, [answers, timeLeftX]);

  useEffect(() => {
    if (!session) return;
    isMounted.current = true;

    const getAssessment = async () => {
      try {
        attachHeaders(session!.user!.token);
        const draftRes = await localAxios.get(`assessment/draft/${id}`, {
          signal: controller.signal,
        });
        const startRes = await localAxios.post(`/assessment/start-test/${id}`, {
          signal: controller.signal,
        });

        // Draft request successfull
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
              {}
            );

            answeredQuestions = formatted;
            setAnswers(formatted);
          }
        }

        // Exams request successfull
        if (startRes.status == 200) {
          setPageData(startRes.data.data);
          setQuestions(() => {
            const allQst = startRes.data.data.sections.reduce(
              (acc: any, sct: any) => {
                acc.push(...sct.questions);
                return acc;
              },
              []
            );

            if (answeredQuestions) {
              const { answered, unanswered } = allQst.reduce(
                (acc: any, q: any) => {
                  if (answeredQuestions[q._id]) {
                    acc.answered.push(q);
                  } else {
                    acc.unanswered.push(q);
                  }
                  return acc;
                },
                { answered: [], unanswered: [] }
              );

              return [...answered, ...shuffleArray(unanswered)];
            }

            return shuffleArray(allQst);
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

    const poll = async () => {
      if (!isMounted.current) return;

      const formData = {
        answers: Object.values(latestDataRef.current.answers),
        timeLeft: latestDataRef.current.timeLeft,
      };

      setLoading("poll");
      try {
        // Cancel previous request if still pending
        abortRef.current?.abort();

        // Init new controller for new request
        abortRef.current = new AbortController();

        attachHeaders(session!.user!.token);

        if (
          Object.values(latestDataRef.current.answers).length < 1 ||
          latestDataRef.current.timeLeft === null
        ) {
          console.log(
            "Draft Save Cancelled: No data to save, Time not reading yet or time expired."
          );
        } else {
          const res = await localAxios.post(
            `assessment/submit-draft/${id}`,
            formData,
            {
              signal: abortRef.current.signal,
            }
          );

          lastSavedRef.current = res?.data?.data?.lastSync;
        }
        setLoading(null);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Polling failed:", err);
        }
      } finally {
        if (isMounted.current) {
          timeoutRef.current = setTimeout(poll, 40_000);
        }
      }
    };

    // Keyboard downn
    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;

      // Don't intercept keypresses when the user is typing in a field
      if (tag === "TEXTAREA" || tag === "INPUT") return;

      let key = event.key;

      // Handle arrow keys
      if (key === "ArrowRight") {
        return nextQuestion();
      }
      if (key === "ArrowLeft") {
        return prevQuestion();
      }

      const qs = questionsRef.current;
      const index: number = activeQuestionRef.current;

      if (!qs) return;
      const q = qs[index];

      // Handle option keys
      if (["A", "B", "C", "D", "a", "b", "c", "d"].includes(key)) {
        if (!questions) return;
        setAnswers((prev) => {
          return {
            ...prev,
            [q._id]: {
              question: q._id,
              type: q.type,
              selectedOption: key.toUpperCase(),
            },
          };
        });
      }
    };

    !pageData && getAssessment();
    pageData && poll();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      controller.abort();
      isMounted.current = false;
      timeoutRef.current && clearTimeout(timeoutRef.current);
      abortRef.current?.abort();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [session, pageData]);

  return (
    <>
      {pageData && questions && (
        <SecurityMonitor
          maxViolations={5}
          disableRightClick
          disableClipboard
          onViolation={(v) => console.log(v)}
          blockOn={[
            "TAB_SWITCH",
            "KEYBOARD_SHORTCUT",
            "COPY",
            "CUT",
            "FULLSCREEN_EXIT",
          ]}
        >
          {!assSubmited && (
            <div className="relative grow grid grid-cols-12 min-h-full px-10 font-sans">
              {/* Main Bar */}
              <div className="col-span-9 flex flex-col justify-between border-r pr-5 pt-10">
                {/* Upper Content */}
                <div>
                  {/* Heading & Submit */}
                  <div className="h-14 bg-red-100s flex items-center border-b justify-between gap-5">
                    {/* Heading */}
                    <div className="bordesr-b  grow">
                      <div className="text-xl font-semibold">
                        {pageData?.title}
                      </div>
                      <div className="text-theme-gray text-sm">
                        {pageData?.course?.title}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Update Status */}
                      <div className="border h-10 w-48 text-sm flex items-center text-theme-gray justify-center gap-2 rounded-md">
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

                      {/* Submit Button */}
                      <div className="w-42">
                        <Button
                          type="button"
                          onClick={() => setShowEndExam(true)}
                          title="Submit Exam"
                          loading={loading == "submitTest"}
                          variant="fill"
                        />
                      </div>
                    </div>
                  </div>
                  <Spacer size="xl" />

                  {/* Question */}
                  <div className="min-h-24">
                    {/* Objective and Subjective Question */}
                    {questions[activeQuestion]?.type !== "subjective" && (
                      <div className="flex">
                        {/* Question Number */}
                        <div className="w-12 h-fit shrink-0 font-semibold underline">
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
                      <p>
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
                                      const qstRef = questions[activeQuestion];
                                      const prevEntry = prev[qstRef._id];

                                      const updatedSlots =
                                        prevEntry?.subjectiveAnswers
                                          ? [...prevEntry.subjectiveAnswers]
                                          : [];

                                      // Compensate for ghost index in between caused by spliting
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
                                  style={{
                                    width: "180px",
                                    margin: "0 5px",
                                    border: "none",
                                    borderBottom: "1px solid black",
                                    outline: "none",
                                  }}
                                />
                              );
                            }

                            return <span key={index}>{part}</span>;
                          }
                        )}
                      </p>
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
                      onFocus={handleRadioFocus} // prevent auto-select answer on arrow navigation
                    >
                      {questions[activeQuestion].options.map(
                        (opt: any, key: number) => {
                          return (
                            <div className="flex items-center gap-3" key={key}>
                              <RadioGroupItem
                                value={opt.label}
                                id={`r${key + 1}`}
                                className="cursor-pointer"
                              />

                              <label
                                htmlFor={`r${key + 1}`}
                                className="flex items-center gap-2 select-none cursor-pointer"
                              >
                                <span className="font-bold text-sm">{`[${opt.label}]`}</span>
                                <span>{opt.text}</span>
                              </label>
                            </div>
                          );
                        }
                      )}
                    </RadioGroup>
                  )}

                  {/* Theory Options */}
                  {questions[activeQuestion].type == "theory" && (
                    <textarea
                      className="border w-full min-h-42 max-h-42  px-4 py-4 rounded-md outline-none"
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

                {/* Footer Content */}
                <div className="mb-10 flex items-center gap-4">
                  {/* Prev Button */}
                  <div className="w-24 shrink-0">
                    <Button
                      title="Previous"
                      variant="fill"
                      type="button"
                      loading={false}
                      onClick={prevQuestion}
                    />
                  </div>

                  {/* Question Counter */}
                  <div className="flex items-center justify-center gap-2 grow text-base">
                    {`Question ${activeQuestion + 1} out of ${
                      questions.length
                    } `}
                  </div>

                  {/* Next Button */}
                  <div className="w-24 shrink-0">
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

              {/* SideBar */}
              <div className="col-span-3 flex flex-col pl-5 pt-10 -mr-5">
                {/* Time Counter */}
                <div className="flex h-14  items-center gap-2 text-black/80 border-b w-full">
                  <Clock4 size={32} strokeWidth="2.5" />
                  <div>
                    <div className="text-xs leading-none text-theme-gray">
                      Your Time
                    </div>
                    <div className="text-xl font-extrabold leading-none">
                      <Counter
                        durationInSeconds={
                          examDurationRef.current !== null &&
                          examDurationRef.current !== 0
                            ? examDurationRef.current
                            : Number(pageData.timeLimit * 60)
                        }
                        onComplete={handleTimeUp}
                        timeLeftParams={{ timeLeftX, setTimeLeftX }}
                      />
                    </div>
                  </div>
                </div>
                <Spacer size="md" />

                {/* User details */}
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
                  <div className="text-sm text-theme-gray ">
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

              {/* Questions Overview */}
              <div className="absolute top-0 -left-[20vw] w-[20vw] mt-32 p-5">
                <div className="text-sm text-accent-dim">
                  Answered Questions{" "}
                  {`(${Object.keys(answers).length}/${questions.length})`}
                </div>
                <Spacer size="sm" />
                <div className=" bg-reds-100 flex flex-wrap gap-2 overflow-y-scroll max-h-[60vh]">
                  {questions.map((qst, key) => (
                    <button
                      type="button"
                      key={key}
                      className={`h-5 w-5  flex items-center justify-center text-xs font-semibold
                                               
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

                    {/* Prompt Text */}
                    <div className="text-3xl text-accent-dim font-semibold">
                      Are you sure?
                    </div>
                    <Spacer size="xl" />

                    {/* Buttons */}
                    <div className="flex items-center gap-4">
                      <div className="w-38">
                        <Button
                          title={"No, Go back"}
                          loading={loading === "submitAss"}
                          variant={"outline"}
                          onClick={() => setShowEndExam(false)}
                        />
                      </div>

                      <div className="w-38">
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

                    {/* Prompt Text */}
                    <div className="text-3xl text-accent-dim font-semibold">
                      Your time is up!
                    </div>
                    <Spacer size="xl" />

                    {/* Buttons */}
                    <div className="flex items-center gap-4">
                      <div className="w-38">
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

              {/* Dialog - Submision on exam */}
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
                      You can no longer submit, your saved entried will be
                      recorded
                    </DialogDescription>
                  </DialogHeader>

                  <div className="w-full flex flex-col items-center mt-10">
                    <Clock2Icon size={82} className="text-accent-dim" />

                    {/* Prompt Text */}
                    <div className="text-3xl text-accent-dim font-semibold">
                      Exam has ended
                    </div>
                    <Spacer size="md" />

                    <div className="text-ss text-theme-gray text-center px-5">
                      The admin ended exams while you were writting, your
                      entries will be saved upto the time the exam was ended,
                      contact your administrator.
                    </div>
                    <Spacer size="xl" />

                    {/* Buttons */}
                    <div className="flex items-center gap-4">
                      <div className="w-48">
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
            <div className="relative grow grid grid-cols-12 min-h-full px-10 font-sans">
              <div className="col-span-12 h-full flex flex-col items-center justify-center -mt-5">
                <div className="bg-accent-light rounded-full p-10">
                  <Check size={98} strokeWidth={2.5} className="text-accent" />
                </div>
                <Spacer size="lg" />

                <div className="text-4xl font-bold text-accent-dim">
                  Exams Submitted!
                </div>

                <div className="text-black/80 hidden">
                  Please logout or return to your dashboard
                </div>
                {/* <Spacer size="md" /> */}

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
                {/* <Spacer size="xl" /> */}

                <div className="hidden flexs gap-2 text-accent-dim">
                  <div className="text-2xl font-bold">Total Score:</div>
                  <div className="text-2xl">
                    {assSubmited?.totalScore}/{pageData?.totalMarks}
                  </div>
                </div>
                <Spacer size="xl" />

                <div className="w-72">
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
