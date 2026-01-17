"use client";
import Button from "@/components/button";
import Spacer from "@/components/spacer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, ChevronRightIcon, Clock4, User2 } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useState } from "react";

const Page = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>("page");
  const [activeQuestion, setActiveQuestion] = useState(0);
  const exam = {
    id: "458u0twrjigsos0tjeqrw0",
    code: "CMP202",
    title: "Perimeter Security II",
    date: "21st April 2026",
    time: "4:30PM",
  };

  const questions = [
    {
      question:
        "Thomas Sankara was a revolutionary Pan-Africanist leader who served as President of Burkina Faso (formerly Upper Volta) from 1983 until his assassination in  before being overthrown by his close ally Blaise Compaoré, who reversed many of his reforms?",
      options: [
        { label: "A", text: "A visitor" },
        { label: "B", text: "Uninvited guest to a wedding" },
        { label: "C", text: "A player" },
        {
          label: "D",
          text: "A very unexpected attack on enterprise machinery",
        },
      ],
    },
    {
      question:
        "Kwame Nkrumah (1909-1972) was Ghana's first Prime Minister and President, leading the former Gold Coast to independence from Britain in 1957 and becoming a key Pan-African leader, advocating for African unity and decolonization, though his later authoritarian rule and economic policies led to his overthrow in 1966",
      options: [
        { label: "A", text: "Good Story" },
        { label: "B", text: "Uninvited guest to a wedding" },
        { label: "C", text: "A player" },
        {
          label: "D",
          text: "A very unexpected attack on enterprise machinery",
        },
      ],
    },
    {
      question:
        "Thomas Sankara was a revolutionary Pan-Africanist leader who served as President of Burkina Faso (formerly Upper Volta) from 1983 until his assassination in  before being overthrown by his close ally Blaise Compaoré, who reversed many of his reforms?",
      options: [
        { label: "A", text: "A visitor" },
        { label: "B", text: "Uninvited guest to a wedding" },
        { label: "C", text: "A player" },
        {
          label: "D",
          text: "A very unexpected attack on enterprise machinery",
        },
      ],
    },
  ];

  return (
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
              <div className="grow">{questions[activeQuestion].question}</div>
            </div>
          </div>
          <Spacer size="sm" />

          {/* Options */}
          <RadioGroup>
            {questions[activeQuestion].options.map((opt, key) => {
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
                    <span> {opt.text}</span>
                  </label>
                </div>
              );
            })}
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
            <div className="text-xl font-extrabold leading-none">0:10:55</div>
          </div>
        </div>
        <Spacer size="md" />

        {/* User details */}
        {/* Profile Picture */}
        <div className="h-[250px] w-[250px] flex items-center justify-center self-center bg-theme-gray-light rounded-md">
          <User2 size={200} strokeWidth={0.5} className="text-theme-gray-mid" />
        </div>
        <Spacer size="md" />

        {/* Registration Number */}
        <div className="border-b pb-2">
          <div className="text-sm text-theme-gray ">Registration Number</div>
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
