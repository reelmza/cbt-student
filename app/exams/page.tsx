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
        <div className="grow w-full flex flex-col lg:grid grid-cols-12 min-h-full p-4 sm:p-6 lg:px-10 lg:py-5  font-sans">
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

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9 flex flex-col justify-start h-fit">
            {/* Title Box */}
            <div className="text-accent font-semibold text-2xl font-serif text-left">
              Available Exams ({pageData?.length})
            </div>
            <Spacer size="xs" />
            <div className="w-1/2 text-xs text-theme-gray">
              Select the exam you wish to take, you can take all the exams
              listed here one after the other.
            </div>
            <Spacer size="md" />

            {/* Exams */}
            <div className="w-full flex flex-wrap items-stretch gap-4">
              {pageData.map((ex, key) => {
                return (
                  <Link
                    href={`/instructions/${ex._id}`}
                    key={key}
                    className="group flex w-full lg:w-[calc(50%-1.8rem)]"
                  >
                    <div className="flex w-full flex-col rounded-xl border bg-white p-4 lg:p-5 transition-colors duration-300 group-hover:border-accent/40">
                      {/* Exam Title and Code */}
                      <div className="flex items-start gap-3">
                        <div className="min-w-0">
                          <div className="text-lg lg:text-xl font-semibold font-serif leading-snug truncate group-hover:text-accent">
                            {ex.title}
                          </div>
                          <div className="text-sm text-theme-gray truncate">
                            {ex.course.title}
                          </div>
                        </div>
                      </div>
                      <Spacer size="xs" />

                      <div className="flex items-center justify-between text-xs lg:text-sm">
                        {/* Exam Time */}
                        <div className="flex items-center gap-1.5 text-theme-gray text-xs">
                          <CalendarDays size={14} strokeWidth={1.5} />
                          <span>{prettyDate(ex.dueDate.split("T")[0])}</span>
                        </div>

                        {/* Start Icon */}
                        <div className="flex items-center gap-1.5 font-medium text-accent-dim transition-all group-hover:gap-2.5">
                          <span>Start</span>
                          <ArrowRight size={16} strokeWidth={2} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right SideBar */}
          <div className="col-span-12 lg:col-span-3 hidden lg:flex flex-wrap items-start gap-4 lg:flex-col bg-white border rounded-xl overflow-hidden h-fit">
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
                <div className="text-xs font-light">Registration Number</div>
                <div className="font-semibold">{session?.user?.regNumber}</div>
                <Spacer size="md" />

                {/* Full Name */}
                <div className="text-xs font-light">Full Name</div>
                <div className="font-semibold">{session?.user?.fullName}</div>
                <Spacer size="md" />

                {/* Level*/}
                <div className="text-xs font-light">Level</div>
                <div className="font-semibold">{session?.user?.level}</div>
                <Spacer size="md" />

                {/* User ID*/}
                <div className="text-xs font-light">User Id</div>
                <div className="font-semibold">
                  /{session?.user?.id?.slice(-8)}
                </div>
                <Spacer size="md" />

                {/* User ID*/}
                <div className="text-xs font-light">Session</div>
                <div className="font-semibold">
                  {session?.expires && prettyDate(session?.expires)}
                </div>
                <Spacer size="md" />
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
              className="lg:-ml-10 h-45 lg:h-75"
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

          {/* Right SideBar */}
          <div className="col-span-12 lg:col-span-3 hidden lg:flex flex-wrap items-start gap-4 lg:flex-col bg-white border rounded-xl overflow-hidden h-fit">
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
                <div className="text-xs font-light">Registration Number</div>
                <div className="font-semibold">{session?.user?.regNumber}</div>
                <Spacer size="md" />

                {/* Full Name */}
                <div className="text-xs font-light">Full Name</div>
                <div className="font-semibold">{session?.user?.fullName}</div>
                <Spacer size="md" />

                {/* Level*/}
                <div className="text-xs font-light">Level</div>
                <div className="font-semibold">{session?.user?.level}</div>
                <Spacer size="md" />

                {/* User ID*/}
                <div className="text-xs font-light">User Id</div>
                <div className="font-semibold">
                  /{session?.user?.id?.slice(-8)}
                </div>
                <Spacer size="md" />

                {/* User ID*/}
                <div className="text-xs font-light">Session</div>
                <div className="font-semibold">
                  {session?.expires && prettyDate(session?.expires)}
                </div>
                <Spacer size="md" />
              </div>
            </div>
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
