"use client";
import Spacer from "@/components/spacer";
import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, localAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { ArrowRight } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const Page = () => {
  const controller = new AbortController();
  const { data: session } = useSession();

  const [pageData, setPageData] = useState<
    | {
        _id: string;
        title: string;
        dueDate: string;
        course: { title: string };
      }[]
    | null
  >(null);
  const [loading, setLoading] = useState<string | null>("page");

  useEffect(() => {
    if (!session) return;

    const getAssessments = async () => {
      try {
        attachHeaders(session!.user!.token);
        const res = await localAxios.get("/assessment/student-assessments", {
          signal: controller.signal,
        });

        if (res.status == 200) {
          setPageData(res.data.data);
        }

        setLoading(null);
      } catch (error: any) {
        if (error.name !== "CanceledError") {
          setLoading("pageError");
          console.log(error);
        }
      }
    };

    !pageData && getAssessments();

    return () => {
      controller.abort();
    };
  }, [session]);

  return (
    <>
      {pageData && pageData.length > 0 && (
        <div className="grow min-h-full p-10 font-sans">
          <div className="text-accent font-semibold text-xl">
            Exams Available
          </div>
          <Spacer size="md" />

          <div className="w-full flex flex-wrap items-center gap-4">
            {pageData.map((ex, key) => {
              return (
                <Link
                  href={`/exams/${ex._id}`}
                  key={key}
                  className="group flex w-3/10 hover:px-1 transition-all duration-300 hover:text-accent"
                >
                  <div className="w-full border rounded-md shadow-lg shadow-theme-gray-light/50 p-5">
                    {/* Exam Title and Code */}
                    <div className="text-2xl font-semibold">{ex.title}</div>
                    <div className="text-theme-gray group-hover:text-accent">
                      {ex.course.title}
                    </div>
                    <Spacer size="md" />

                    <div className="flex items-center justify-between text-sm text-theme-gray group-hover:text-accent">
                      {/* Exam Time */}
                      <div>{prettyDate(ex.dueDate.split("T")[0])}</div>

                      {/* Start Icon */}
                      <div className="flex items-center gap-1">
                        <span>Start</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* No exams due */}
      {pageData && pageData.length < 1 && (
        <div className="grow min-h-full p-10 font-sans">
          <div>
            <div>You have no assesment due at this time.</div>
          </div>
        </div>
      )}

      {/* Page Loading */}
      {!pageData && loading == "page" && (
        <div className="grow min-h-full p-10 font-sans">
          <div className="flex items-center gap-2 ">
            <Spinner />
            <div>Fetching Courses</div>
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

const PageWrapper = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};

export default PageWrapper;
