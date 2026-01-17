"use client";
import Button from "@/components/button";
import Counter from "@/components/counter";
import Spacer from "@/components/spacer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, localAxios } from "@/lib/axios";
import { ChevronRightIcon, Clock4, User2 } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useEffect, useMemo, useState } from "react";

const Page = ({ id }: { id: string }) => {
  const controller = new AbortController();
  const { data: session } = useSession();

  // Component States
  const [loading, setLoading] = useState<string | null>("page");
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [questions, setQuestions] = useState<QuestionType | null>(null);
  const [answers, setAnswers] = useState<AnswerType>({});
  const [pageData, setPageData] = useState<{}[] | null>(null);

  const exam = {
    id: "458u0twrjigsos0tjeqrw0",
    code: "CMP202",
    title: "Perimeter Security II",
    date: "21st April 2026",
    time: "4:30PM",
  };

  // Next Question
  const nextQuestion = () => {
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

  useEffect(() => {
    if (!session) return;

    const getAssessment = async () => {
      try {
        attachHeaders(session!.user!.token);
        const res = await localAxios.get(`/assessment/findone/${id}`, {
          signal: controller.signal,
        });

        if (res.status == 200) {
          setPageData(res.data.data);
          setQuestions(
            res.data.data.sections.reduce((acc: any, sct: any) => {
              acc.push(...sct.questions);
              return acc;
            }, [])
          );

          return;
        }

        setLoading(null);
      } catch (error: any) {
        if (error.name !== "CanceledError") {
          setLoading("pageError");
          console.log(error);
        }
      }
    };

    !pageData && getAssessment();

    return () => {
      controller.abort();
    };
  }, [session]);

  return (
    <>
      {pageData && questions && (
        <div className="grow grid grid-cols-12 min-h-full px-10 font-sans">
          {/* Main Bar */}
          <div className="col-span-9 flex flex-col justify-between border-r pr-5 pt-10">
            {/* Upper Content */}
            <div>
              {/* Heading & Submit */}
              <div className="h-14 bg-red-100s flex items-center border-b justify-between gap-5">
                {/* Heading */}
                <div className="bordesr-b  grow">
                  <div className="text-xl font-semibold">{exam.code}</div>
                  <div className="text-theme-gray text-sm">{exam.title}</div>
                </div>

                {/* Submit Button */}
                <div className="w-42">
                  <Button
                    title="Submit Exam"
                    loading={loading == "submitExam"}
                    variant="fill"
                  />
                </div>
              </div>
              <Spacer size="xl" />

              {/* Question */}
              <div className="min-h-24 bg-red-10s0">
                <div className="flex text-lsg">
                  {/* Question Number */}
                  <div className="w-12 h-fit shrink-0 font-semibold underline">
                    Q{activeQuestion + 1}.
                  </div>

                  {/* Question Text */}
                  <div className="grow">
                    {questions[activeQuestion].question}
                  </div>
                </div>
              </div>
              <Spacer size="sm" />

              {/* Options */}
              <RadioGroup
                value={
                  answers[`${questions[activeQuestion]._id}`]?.selectedOption ||
                  ""
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
            </div>

            {/* Footer Content */}
            <div className="mb-10 flex items-center gap-4">
              {/* Prev Button */}
              <div className="w-24 shrink-0">
                <Button
                  title="Previous"
                  variant="outline"
                  type="button"
                  loading={false}
                  onClick={prevQuestion}
                />
              </div>

              {/* Question Counter */}
              <div className="flex items-center justify-center gap-2 grow text-base">
                {`Question ${activeQuestion + 1} out of ${questions.length} `}
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
                    durationInSeconds={3600}
                    onComplete={() => alert("Complete")}
                  />
                </div>
              </div>
            </div>
            <Spacer size="md" />

            {/* User details */}
            {/* Profile Picture */}
            <div className="h-[250px] w-[250px] flex items-center justify-center self-center bg-theme-gray-light rounded-md">
              <User2
                size={200}
                strokeWidth={0.5}
                className="text-theme-gray-mid"
              />
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

            {/* Gender */}
            <div className="pb-2">
              <div className="text-sm text-theme-gray">Gender</div>
              <div>{session?.user?.gender}</div>
            </div>
          </div>
        </div>
      )}

      {/* Page Loading */}
      {!pageData && loading == "page" && (
        <div className="grow min-h-full p-10 font-sans">
          <div className="flex items-center gap-2 ">
            <Spinner />
            <div>Getting Questions</div>
          </div>
        </div>
      )}

      {/* Error */}
      {!pageData && loading == "pageError" && (
        <div className="grow min-h-full p-10 font-sans">
          <div>
            <div>An error occured please refresh the page.</div>
          </div>
        </div>
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
