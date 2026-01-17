"use client";
import Spacer from "@/components/spacer";
import { ArrowRight } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import Link from "next/link";

const Page = () => {
  const { data: session } = useSession();
  console.log(session);
  const exams = [
    {
      id: "458u0twrjigsos0tjeqrw0",
      code: "CMP202",
      title: "Perimeter Security II",
      date: "21st April 2026",
      time: "4:30PM",
    },

    {
      id: "458u0twrjid434gsodsfs0tjeqrw0",
      code: "CMP401",
      title: "Artifical Intelligence",
      date: "21st April 2026",
      time: "4:30PM",
    },
  ];
  return (
    <div className="grow min-h-full p-10 font-sans">
      <div className="text-accent font-semibold text-xl">Exams Available</div>
      <Spacer size="md" />

      <div className="w-full flex flex-wrap items-center gap-4">
        {exams.map((ex, key) => {
          return (
            <Link
              href={`/exams/${ex.id}`}
              key={key}
              className="group flex w-3/10 hover:px-1 transition-all duration-300 hover:text-accent"
            >
              <div className="w-full border rounded-md shadow-lg shadow-theme-gray-light/50 p-5">
                {/* Exam Title and Code */}
                <div className="text-2xl font-semibold">{ex.code}</div>
                <div className="text-theme-gray group-hover:text-accent">
                  {ex.title}
                </div>
                <Spacer size="md" />

                <div className="flex items-center justify-between text-sm text-theme-gray group-hover:text-accent">
                  {/* Exam Time */}
                  <div>
                    {ex.time} - {"5:40PM"}
                  </div>

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
