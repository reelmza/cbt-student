"use client";
import Spacer from "@/components/spacer";
import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, localAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { ArrowRight, User2 } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import emptyClipboard from "@/public/images/illustrations/empty_clipboard.svg";
import restMan from "@/public/images/illustrations/rest_man.svg";
import Preload from "@/components/preload";

const Page = () => {
  const controller = new AbortController();
  const { data: session } = useSession();
  console.log(session);
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
        <div className="grow grid grid-cols-12 min-h-full p-10 font-sans">
          <div className="col-span-9">
            <div className="text-foreground font-semibold text-2xl font-serif">
              Scheduled Exams
            </div>
            <Spacer size="md" />

            {/* Exams */}
            <div className="w-full flex flex-wrap items-center gap-4">
              {pageData.map((ex, key) => {
                return (
                  <Link
                    href={`/instructions/${ex._id}`}
                    key={key}
                    className="group flex w-4/10 hover:px-1 transition-all duration-300 hover:text-accent"
                  >
                    <div className="w-full border rounded-md shadow-lg shadow-theme-gray-light/50 p-5">
                      {/* Exam Title and Code */}
                      <div className="text-2xl font-semibold font-serif">
                        {ex.title}
                      </div>
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

          {/* SideBar */}
          <div className="col-span-3 flex flex-col pl-5 pt-10 -mr-5 border-l">
            {/* User details */}
            {/* Profile Picture */}
            <div className="h-62.5 w-62.5 flex items-center justify-center self-center bg-theme-gray-light  overflow-hidden">
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
                  unoptimized
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
        </div>
      )}

      {/* No exams due */}
      {pageData && pageData.length < 1 && (
        <div className="grow grid grid-cols-12 min-h-full p-10 font-sans">
          <div className="col-span-9 flex flex-col items-center justify-center">
            <Image
              src={restMan}
              alt="Empty Exams"
              height={280}
              className="-ml-10"
            />
            <Spacer size="xl" />

            <div className="text-accesnt-dim text-3xl font-bold font-serif">
              No Exams Scheduled
            </div>
            <Spacer size="sm" />

            <div className="w-2/3 text-center text-theme-gray">
              You have written all your exams or no exams have been scheduled
              for you yet, if this is not true, contact the nearest admin.
            </div>
          </div>

          {/* SideBar */}
          <div className="col-span-3 flex flex-col pl-5 pt-10 -mr-5 border-l">
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
        </div>
      )}

      <Preload loading={loading} pageData={pageData ? true : false} />
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
