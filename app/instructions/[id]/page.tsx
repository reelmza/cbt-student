"use client";
import Button from "@/components/button";
import Preload from "@/components/preload";

import Spacer from "@/components/spacer";

import { Spinner } from "@/components/ui/spinner";
import { getAxios } from "@/lib/axios";

import { ArrowRight, CircleSmall } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
        <div className="relative grow min-h-full px-4 py-5 sm:px-10 sm:py-7 font-sans">
          {/* Heading & Submit */}
          <div className="w-fit flex items-start sm:items-center justify-between gap-5 border-b pb-3 sm:pb-0 sm:h-14">
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

          {/* Instruction brief */}
          <div className="w-full sm:w-6/10 font-normal text-sm sm:text-base">
            Please read all instructions carefully before attempting exams, you
            can find all relevant information regarding this assessment below.
            Goodluck.
          </div>
          <Spacer size="md" />

          {/* Instructions */}
          {pageData?.instruction.split(",").map((item, key) => {
            return (
              <div
                key={key}
                className="ml-2 sm:ml-4 flex items-start gap-3 sm:gap-4 mb-2"
              >
                <CircleSmall size={14} className="mt-1 shrink-0" />
                <div className="text-sm sm:text-base">{item}</div>
              </div>
            );
          })}

          {/* Exam details */}
          <div className="w-full sm:w-6/10 pt-5">
            {/* Session */}
            <div className="min-h-10 flex items-center border-x border-t border-accent-light overflow-hidden px-2 py-2 bg-accent-light">
              <div className="w-36 sm:w-42 shrink-0 font-semibold text-sm sm:text-base">
                Exam Session
              </div>
              <div className="text-sm sm:text-base">{pageData?.session}</div>
            </div>

            {/* Semester */}
            <div className="min-h-10 flex items-center border border-accent-light overflow-hidden px-2 py-2">
              <div className="w-36 sm:w-42 shrink-0 font-semibold text-sm sm:text-base">
                Exam Semester
              </div>
              <div className="text-sm sm:text-base">
                {pageData?.term == 1 ? "First Semester" : "Second Semester"}
              </div>
            </div>

            {/* Time Allocated */}
            <div className="min-h-10 flex items-center border-x border-t border-accent-light overflow-hidden px-2 py-2 bg-accent-light">
              <div className="w-36 sm:w-42 shrink-0 font-semibold text-sm sm:text-base">
                Time
              </div>
              <div className="text-sm sm:text-base">
                {pageData?.timeLimit} Minutes
              </div>
            </div>

            {/* Total Marks */}
            <div className="min-h-10 flex items-center border border-accent-light overflow-hidden px-2 py-2">
              <div className="w-36 sm:w-42 shrink-0 font-semibold text-sm sm:text-base">
                Total Marks
              </div>
              <div className="text-sm sm:text-base">
                {pageData?.totalMarks} Marks
              </div>
            </div>

            {/* Sections */}
            <div className="min-h-10 flex items-center border-b border-x border-accent-light overflow-hidden px-2 py-2 bg-accent-light">
              <div className="w-36 sm:w-42 shrink-0 font-semibold text-sm sm:text-base">
                Total Sections
              </div>
              <div className="text-sm sm:text-base">
                {pageData?.sections.length} Section(s)
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
