"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import { type ReactNode, use, useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/button";
import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import { Spinner } from "@/components/ui/spinner";
import { getAxios } from "@/lib/axios";

// A single keyboard keycap used in the visual guide.
const KeyCap = ({
  children,
  active,
}: {
  children: ReactNode;
  active?: boolean;
}) => (
  <span
    className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg border text-sm font-bold select-none ${
      active
        ? "border-accent bg-accent text-white shadow-[0_3px_0_rgba(0,0,0,0.18)]"
        : "border-accent-light bg-white text-theme-gray shadow-[0_3px_0_rgba(0,0,0,0.06)]"
    }`}
  >
    {children}
  </span>
);

const Page = ({ id }: { id: string }) => {
  const controller = new AbortController();
  const router = useRouter();
  const { data: session } = useSession();

  // Component States
  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<PageDataType | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    const getAssessment = async () => {
      try {
        const api = await getAxios();

        const res = await api.get(`/assessment/findone/${id}`, {
          signal: controller.signal,
        });

        // Exams request successfull
        if (res.status == 200 || res.status == 201) {
          setPageData(res.data.data);
        }

        setLoading(null);
      } catch (error: any) {
        if (error?.name !== "CanceledError") {
          if (error?.message) {
            setPageError(error?.response?.data?.message);
          }
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
      {!loading && (
        <div className="relative grow min-h-full px-4 py-5 sm:px-10 font-sans">
          {/* Heading & title */}
          <div className="w-fit flex items-start sm:items-center justify-between gap-5 border-b pb-3 sm:pb-0 sm:h-12">
            {/* Heading */}
            <div className="grow">
              <div className="text-xl sm:text-2xl font-semibold font-serif leading-snug">
                {pageData?.title}
              </div>
              <div className="text-theme-gray text-sm">
                {pageData?.course?.title}
              </div>
            </div>
          </div>
          <Spacer size="sm" />

          {/* Two-column layout: details (6/10) + visual guide (4/10) */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Left: brief, instructions & exam details */}
            <div className="w-full lg:w-6/10">
              {/* Instruction brief */}
              <div className="text-sm sm:text-base text-black/80">
                Please read all instructions carefully before attempting exams,
                you can find all relevant information regarding this assessment
                below. Goodluck.
              </div>
              <Spacer size="md" />

              {/* Instructions */}
              <div className="text-base font-semibold text-accent-dim">
                Instructions
              </div>
              <Spacer size="sm" />
              {pageData?.instruction.split(",").map((item, key) => {
                return (
                  <div
                    key={key}
                    className="ml-1 sm:ml-2 flex items-start gap-3 mb-2.5"
                  >
                    <span className="flex h-5 w-5 mt-0.5 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent-dim">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <div className="text-sm sm:text-base text-black/80">
                      {item}
                    </div>
                  </div>
                );
              })}

              {/* Exam details */}
              <div className="w-full pt-5">
                <div className="text-base font-semibold text-accent-dim">
                  Exam Details
                </div>
                <Spacer size="sm" />
                <div className="rounded-xl border border-accent-light overflow-hidden divide-y divide-accent-light bg-white">
                  {/* Session */}
                  <div className="flex items-center gap-3 px-4 py-2">
                    <span className="flex shrink-0 items-center justify-center text-accent-dim">
                      <CalendarDays size={16} />
                    </span>
                    <span className="text-sm text-theme-gray">
                      Exam Session
                    </span>
                    <span className="ml-auto text-sm sm:text-base font-semibold text-right">
                      {pageData?.session}
                    </span>
                  </div>

                  {/* Semester */}
                  <div className="flex items-center gap-3 px-4 py-2">
                    <span className="flex shrink-0 items-center justify-center text-accent-dim">
                      <BookOpen size={16} />
                    </span>
                    <span className="text-sm text-theme-gray">
                      Exam Semester
                    </span>
                    <span className="ml-auto text-sm sm:text-base font-semibold text-right">
                      {pageData?.term == 1
                        ? "First Semester"
                        : "Second Semester"}
                    </span>
                  </div>

                  {/* Time Allocated */}
                  <div className="flex items-center gap-3 px-4 py-2">
                    <span className="flex shrink-0 items-center justify-center text-accent-dim">
                      <Clock3 size={16} />
                    </span>
                    <span className="text-sm text-theme-gray">Time</span>
                    <span className="ml-auto text-sm sm:text-base font-semibold text-right">
                      {pageData?.timeLimit} Minutes
                    </span>
                  </div>

                  {/* Total Marks */}
                  <div className="flex items-center gap-3 px-4 py-2">
                    <span className="flex shrink-0 items-center justify-center text-accent-dim">
                      <Award size={16} />
                    </span>
                    <span className="text-sm text-theme-gray">Total Marks</span>
                    <span className="ml-auto text-sm sm:text-base font-semibold text-right">
                      {pageData?.totalMarks} Marks
                    </span>
                  </div>

                  {/* Sections */}
                  <div className="flex items-center gap-3 px-4 py-2">
                    <span className="flex shrink-0 items-center justify-center text-accent-dim">
                      <Layers size={16} />
                    </span>
                    <span className="text-sm text-theme-gray">
                      Total Sections
                    </span>
                    <span className="ml-auto text-sm sm:text-base font-semibold text-right">
                      {pageData?.sections.length} Section(s)
                    </span>
                  </div>
                </div>
                <Spacer size="lg" />

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <div className="w-full sm:w-48">
                    <Button
                      title={"Go back to exams"}
                      loading={false}
                      variant={"fillErrorOutline"}
                      onClick={() => router.push("/exams")}
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <Button
                      title={"Proceed to exam"}
                      loading={false}
                      variant={"fill"}
                      onClick={() => {
                        router.push(`/exams/${id}`);
                      }}
                      icon={<ArrowRight size={14} />}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: keyboard navigation guide */}
            <div className="w-full lg:w-4/10">
              <div className="lg:sticky lg:top-7 rounded-xl border border-accent-light bg-accent-light/30 p-5 sm:p-6">
                <div className="text-base font-semibold text-accent-dim">
                  Keyboard Shortcuts
                </div>
                <div className="text-xs sm:text-sm text-theme-gray">
                  Speed through the exam without your mouse.
                </div>
                <Spacer size="md" />

                {/* Arrow key navigation */}
                <div className="rounded-lg border border-accent-light bg-white p-4 sm:p-5">
                  {/* Inverted-T arrow cluster, left & right shaded */}
                  <div className="flex flex-col items-center gap-1.5">
                    <KeyCap>
                      <ArrowUp size={18} />
                    </KeyCap>
                    <div className="flex gap-1.5">
                      <KeyCap active>
                        <ArrowLeft size={18} />
                      </KeyCap>
                      <KeyCap>
                        <ArrowDown size={18} />
                      </KeyCap>
                      <KeyCap active>
                        <ArrowRight size={18} />
                      </KeyCap>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs sm:text-sm text-theme-gray">
                  Use the <span className="font-semibold">left</span> and{" "}
                  <span className="font-semibold">right</span> arrow keys to
                  move back and forward through questions.
                </div>

                <Spacer size="md" />

                {/* Option selection */}
                <div className="rounded-lg border border-accent-light bg-white p-4 sm:p-5">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <KeyCap active>A</KeyCap>
                    <KeyCap active>B</KeyCap>
                    <KeyCap active>C</KeyCap>
                    <KeyCap active>D</KeyCap>
                  </div>
                </div>
                <div className="mt-2 text-xs sm:text-sm text-theme-gray">
                  Press <span className="font-semibold">A</span>,{" "}
                  <span className="font-semibold">B</span>,{" "}
                  <span className="font-semibold">C</span> or{" "}
                  <span className="font-semibold">D</span> to select an option
                  for the current question.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Preload loading={loading} pageData={pageData ? true : false} />
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
