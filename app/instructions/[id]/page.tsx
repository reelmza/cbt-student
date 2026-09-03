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
const KeyCap = ({ children }: { children: ReactNode }) => (
  <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg border border-theme-gray-mid bg-white text-sm font-bold text-theme-gray select-none shadow-[0_3px_0_rgba(0,0,0,0.06)]">
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
          {/* Two-column layout: details (6/10) + visual guide (4/10) */}
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
            {/* Left: heading, brief, instructions & exam details */}
            <div className="w-full lg:w-6/10">
              {/* Heading & title */}
              <div className="w-fit flex items-start justify-between gap-5">
                {/* Heading */}
                <div className="grow">
                  <div className="text-xl sm:text-2xl font-semibold font-serif leading-snug text-accent-dim">
                    {pageData?.title}
                  </div>
                  <div className="text-theme-gray text-sm">
                    {pageData?.course?.title}
                  </div>
                </div>
              </div>
              <Spacer size="sm" />

              {/* Instructions */}
              <div className="text-base font-semibold text-accent-dim">
                Instructions
              </div>
              <Spacer size="sm" />
              {pageData?.instruction.split(",").map((item, key) => {
                return (
                  <div key={key} className="flex items-start gap-3 mb-2.5">
                    <span className="flex h-5 w-5 mt-0.5 shrink-0 items-center justify-center rounded-full bg-white border border-accent-light text-accent-dim">
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
                    <span className="flex shrink-0 items-center justify-center text-theme-gray">
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
                    <span className="flex shrink-0 items-center justify-center text-theme-gray">
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
                    <span className="flex shrink-0 items-center justify-center text-theme-gray">
                      <Clock3 size={16} />
                    </span>
                    <span className="text-sm text-theme-gray">Time</span>
                    <span className="ml-auto text-sm sm:text-base font-semibold text-right">
                      {pageData?.timeLimit} Minutes
                    </span>
                  </div>

                  {/* Total Marks */}
                  <div className="flex items-center gap-3 px-4 py-2">
                    <span className="flex shrink-0 items-center justify-center text-theme-gray">
                      <Award size={16} />
                    </span>
                    <span className="text-sm text-theme-gray">Total Marks</span>
                    <span className="ml-auto text-sm sm:text-base font-semibold text-right">
                      {pageData?.totalMarks} Marks
                    </span>
                  </div>

                  {/* Sections */}
                  <div className="flex items-center gap-3 px-4 py-2">
                    <span className="flex shrink-0 items-center justify-center text-theme-gray">
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
                      title={"Go back to dashboard"}
                      loading={false}
                      variant={"grayOutline"}
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
              <div className="lg:sticky lg:top-7 rounded-xl border border-accent-light bg-white p-6 sm:p-8">
                <div className="text-base font-semibold text-accent-dim">
                  Keyboard Shortcuts
                </div>
                <div className="text-xs sm:text-sm text-theme-gray">
                  Speed through the exam without your mouse.
                </div>
                <Spacer size="xl" />

                {/* Arrow key navigation */}
                <div className="rounded-lg border border-theme-gray-mid bg-white px-4 py-7 sm:px-5 sm:py-9">
                  {/* Inverted-T arrow cluster */}
                  <div className="flex flex-col items-center gap-2">
                    <KeyCap>
                      <ArrowUp size={18} />
                    </KeyCap>
                    <div className="flex gap-2">
                      <KeyCap>
                        <ArrowLeft size={18} />
                      </KeyCap>
                      <KeyCap>
                        <ArrowDown size={18} />
                      </KeyCap>
                      <KeyCap>
                        <ArrowRight size={18} />
                      </KeyCap>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs sm:text-sm text-theme-gray">
                  Use the <span className="font-semibold">left</span> and{" "}
                  <span className="font-semibold">right</span> arrow keys to
                  move back and forward through questions.
                </div>

                <Spacer size="xl" />

                {/* Option selection */}
                <div className="rounded-lg border border-theme-gray-mid bg-white px-4 py-7 sm:px-5 sm:py-9">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <KeyCap>A</KeyCap>
                    <KeyCap>B</KeyCap>
                    <KeyCap>C</KeyCap>
                    <KeyCap>D</KeyCap>
                  </div>
                </div>
                <div className="mt-4 text-xs sm:text-sm text-theme-gray">
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
