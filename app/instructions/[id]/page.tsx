"use client";
import Button from "@/components/button";

import Spacer from "@/components/spacer";

import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, localAxios } from "@/lib/axios";

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
        attachHeaders(session!.user!.token);

        const res = await localAxios.get(`/assessment/findone/${id}`, {
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
        <div className="relative grow min-h-full p-10 font-sans">
          {/* Heading & Submit */}
          <div className="h-14 w-fit flex items-center justify-between gap-5 border-b">
            {/* Heading */}
            <div className="grow">
              <div className="text-xl font-semibold">{pageData?.title}</div>
              <div className="text-theme-gray text-sm">
                {pageData?.course?.title}
              </div>
            </div>
          </div>
          <Spacer size="sm" />

          {/* Instruction brief */}
          <div className="w-6/10">
            Please read all instructions carefully before attempting exams, you
            can find all relevant information regarding this assessment below.
            Goodluck.
          </div>
          <Spacer size="md" />

          {/* Instructions */}
          {pageData?.instruction.split(",").map((item, key) => {
            return (
              <div key={key} className="ml-4 flex items-center gap-4 mb-2">
                <CircleSmall size={14} />
                <div> {item}</div>
              </div>
            );
          })}

          {/* Exam details */}
          <div className="w-6/10 pt-5">
            {/* Session */}
            <div className="h-10 flex items-center border-x border-t border-accent-light overflow-hidden px-2 bg-accent-light">
              <div className="w-42 font-semibold">Exam Session</div>
              <div>{pageData?.session}</div>
            </div>

            {/* Semester */}
            <div className="h-10 flex items-center border border-accent-light overflow-hidden px-2 ">
              <div className="w-42 font-semibold">Exam Semester</div>
              <div>
                {pageData?.term == 1 ? "First Semester" : "Second Semester"}
              </div>
            </div>

            {/* Time Allocated */}
            <div className="h-10 flex items-center border-x border-t border-accent-light overflow-hidden px-2 bg-accent-light">
              <div className="w-42 font-semibold">Time</div>
              <div>{pageData?.timeLimit} Minutes</div>
            </div>

            {/* Total Marks */}
            <div className="h-10 flex items-center border border-accent-light overflow-hidden px-2 ">
              <div className="w-42 font-semibold">Total Marks</div>
              <div>{pageData?.totalMarks} Marks</div>
            </div>

            {/* Sections */}
            <div className="h-10 flex items-center border-b border-x border-accent-light overflow-hidden px-2 bg-accent-light">
              <div className="w-42 font-semibold">Total Sections</div>
              <div>{pageData?.sections.length} Section(s)</div>
            </div>
            <Spacer size="lg" />

            {/* Buttons */}
            <div className="flex items-center gap-4">
              <div className="w-48">
                <Button
                  title={"Go back to exams"}
                  loading={false}
                  variant={"fillErrorOutline"}
                  onClick={() => router.push("/exams")}
                />
              </div>
              <div className="w-48">
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

      {/* Page Loading */}
      {!pageData && loading == "page" && (
        <div className="grow min-h-full p-10 font-sans">
          <div className="flex items-center gap-2 ">
            <Spinner />
            <div>Getting Exam Information</div>
          </div>
        </div>
      )}

      {/* Unhadled Error Error */}
      {!pageData && loading == "pageError" && (
        <div className="grow min-h-full p-10 font-sans">
          <div>
            <div>{pageError || "An error occured please refresh the page"}</div>
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
