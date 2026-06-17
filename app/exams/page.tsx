"use client";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  LogOut,
  User2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import { Spinner } from "@/components/ui/spinner";
import { getAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import restMan from "@/public/images/illustrations/rest_man.svg";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    const getAssessments = async () => {
      try {
        const api = await getAxios();
        const res = await api.get("/assessment/student-assessments", {
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

        if (error?.status === 401) {
          setLoading("pageError");
          setErrorMessage(
            "You Session Has Expired$Please login again to continue.",
          );
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
        <div className="grow w-full flex flex-col lg:grid grid-cols-12 min-h-full p-4 sm:p-6 lg:p-10 mx-0 font-sans">
          {/* Mobile profile header — hidden on desktop where sidebar takes over */}
          <div className="col-span-12 lg:hidden flex items-center gap-4 mb-5 pb-4 border-b h-fit">
            <div className="size-12 rounded-full bg-theme-gray-light overflow-hidden shrink-0 flex items-center justify-center">
              {!session?.user?.passportPhoto ? (
                <User2
                  size={60}
                  strokeWidth={0.5}
                  className="text-theme-gray-mid"
                />
              ) : (
                <Image
                  src={session?.user?.passportPhoto}
                  alt="Profile photo"
                  height={56}
                  width={56}
                  className="object-cover w-full h-full"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">
                {session?.user?.fullName}
              </div>
              <div className="text-sm text-theme-gray">
                {session?.user?.regNumber} | {session?.user?.level} Level
              </div>
            </div>
            <button
              className="shrink-0 flex items-center justify-center text-sm bg-theme-gray-light hover:bg-theme-gray-mid  size-10  rounded-lg cursor-pointer"
              onClick={() => {
                localStorage.removeItem("countdown_end_time");
                signOut({ redirectTo: "/" });
              }}
            >
              <LogOut size={14} />
            </button>
          </div>

          <div className="col-span-12 lg:col-span-9 flex flex-col justify-start h-fit">
            <div className="flex items-center gap-3">
              <div className="text-foreground font-semibold text-2xl font-serif text-left">
                Scheduled Exams
              </div>
              <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-semibold text-accent-dim">
                {pageData.length}
              </span>
            </div>
            <Spacer size="md" />

            {/* Exams */}
            <div className="w-full flex flex-wrap items-stretch gap-4">
              {pageData.map((ex, key) => {
                return (
                  <Link
                    href={`/instructions/${ex._id}`}
                    key={key}
                    className="group flex w-full lg:w-[calc(50%-0.5rem)]"
                  >
                    <div className="flex w-full flex-col rounded-xl border border-accent-light bg-white p-4 lg:p-5 transition-colors duration-300 group-hover:border-accent/40">
                      {/* Exam Title and Code */}
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-light text-accent-dim transition-colors group-hover:bg-accent/15">
                          <BookOpen size={20} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-lg lg:text-xl font-semibold font-serif leading-snug truncate group-hover:text-accent">
                            {ex.title}
                          </div>
                          <div className="text-sm text-theme-gray truncate">
                            {ex.course.title}
                          </div>
                        </div>
                      </div>
                      <Spacer size="md" />

                      <div className="mt-auto flex items-center justify-between border-t border-accent-light pt-3 text-xs lg:text-sm">
                        {/* Exam Time */}
                        <div className="flex items-center gap-1.5 text-theme-gray">
                          <CalendarDays size={14} />
                          <span>{prettyDate(ex.dueDate.split("T")[0])}</span>
                        </div>

                        {/* Start Icon */}
                        <div className="flex items-center gap-1.5 font-semibold text-accent-dim transition-all group-hover:gap-2.5">
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
          <div className="col-span-12 lg:col-span-3 hidden lg:flex flex-wrap items-start gap-4 lg:flex-col lg:pl-5 lg:pt-10 lg:-mr-5 lg:border-l h-fit">
            {/* Profile Picture */}
            <div className="h-22 lg:h-62.5 w-22 lg:w-62.5 flex items-center justify-center lg:self-center bg-theme-gray-light rounded-full lg:rounded-md overflow-hidden shrink-0 lg:mb-10">
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

            {/* User details */}
            <div className="grow lg:w-full flex flex-col lg:gap-y-2">
              {/* Registration Number */}
              <div className="lg:border-b lg:pb-2">
                <div className="text-sm text-theme-gray hidden lg:block">
                  Registration Number
                </div>
                <div>{session?.user?.regNumber}</div>
              </div>

              {/* Full Name */}
              <div className="lg:pb-2 lg:border-b">
                <div className="text-sm text-theme-gray hidden lg:block">
                  Full Name
                </div>
                <div>{session?.user?.fullName}</div>
              </div>

              {/* Level */}
              <div className="lg:pb-2">
                <div className="text-sm text-theme-gray hidden lg:block">
                  Level
                </div>
                <div>{session?.user?.level}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No exams due */}
      {pageData && pageData.length < 1 && (
        <div className="grow w-full flex flex-col lg:grid grid-cols-12 min-h-full p-5 font-sans">
          {/* Mobile profile header — hidden on desktop where sidebar takes over */}
          <div className="col-span-12 lg:hidden flex items-center gap-4 mb-24 pb-4 border-b h-fit">
            <div className="size-14 rounded-full bg-theme-gray-light overflow-hidden shrink-0 flex items-center justify-center">
              {!session?.user?.passportPhoto ? (
                <User2
                  size={60}
                  strokeWidth={0.5}
                  className="text-theme-gray-mid"
                />
              ) : (
                <Image
                  src={session?.user?.passportPhoto}
                  alt="Profile photo"
                  height={56}
                  width={56}
                  className="object-cover w-full h-full"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">
                {session?.user?.fullName}
              </div>
              <div className="text-sm text-theme-gray">
                {session?.user?.regNumber} | {session?.user?.level} Level
              </div>
            </div>
            <button
              className="shrink-0 flex items-center justify-center text-sm bg-theme-gray-light hover:bg-theme-gray-mid  size-10  rounded-lg cursor-pointer"
              onClick={() => {
                localStorage.removeItem("countdown_end_time");
                signOut({ redirectTo: "/" });
              }}
            >
              <LogOut size={14} />
            </button>
          </div>

          <div className="col-span-12 lg:col-span-9 flex flex-col items-center justify-center sm:mb-10">
            <Image
              src={restMan}
              alt="Empty Exams"
              height={280}
              className="lg:-ml-10 h-[180px] lg:h-[300px]"
            />
            <Spacer size="xl" />

            <div className="text-center text-xl lg:text-3xl font-bold font-serif">
              No Exams Scheduled
            </div>
            <Spacer size="sm" />

            <div className="w-full lg:w-2/3 text-sm lg:text-sm text-center text-theme-gray">
              You have written all your exams or no exams have been scheduled
              for you yet.
            </div>
          </div>

          {/* SideBar */}
          <div className="col-span-12 lg:col-span-3 hidden lg:flex flex-wrap items-start gap-4 lg:flex-col lg:pl-5 lg:pt-10 lg:-mr-5 lg:border-l h-fit">
            {/* Profile Picture */}
            <div className="h-22 lg:h-62.5 w-22 lg:w-62.5 flex items-center justify-center lg:self-center bg-theme-gray-light rounded-full lg:rounded-md overflow-hidden shrink-0 lg:mb-10">
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

            {/* User details */}
            <div className="grow lg:w-full flex flex-col lg:gap-y-2">
              {/* Registration Number */}
              <div className="lg:border-b lg:pb-2">
                <div className="text-sm text-theme-gray hidden lg:block">
                  Registration Number
                </div>
                <div>{session?.user?.regNumber}</div>
              </div>

              {/* Full Name */}
              <div className="lg:pb-2 lg:border-b">
                <div className="text-sm text-theme-gray hidden lg:block">
                  Full Name
                </div>
                <div>{session?.user?.fullName}</div>
              </div>

              {/* Level */}
              <div className="lg:pb-2">
                <div className="text-sm text-theme-gray hidden lg:block">
                  Level
                </div>
                <div>{session?.user?.level}</div>
              </div>
            </div>

            <button
              className={`shrink-0 flex lg:hidden items-center gap-2 px-2 rounded-md h-10 w-full hover:bg-theme-gray-light cursor-pointer text-sm bg-theme-gray-light mt-10`}
              onClick={() => {
                localStorage.removeItem("countdown_end_time");
                signOut({ redirectTo: "/" });
              }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      <Preload
        loading={loading}
        pageData={pageData ? true : false}
        errorMessage={errorMessage}
      />
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
