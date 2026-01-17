"use client";
import Button from "@/components/button";
import Spacer from "@/components/spacer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Clock4 } from "lucide-react";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

const Page = () => {
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
      question: "Who is a threat actor?",
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
      <div className="col-span-9 border-r pr-5 pt-10">
        {/* Heading & Submit */}
        <div className="flex items-center justify-between gap-5">
          {/* Heading */}
          <div className="border-b  grow">
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
        <div className="min-h-38">
          <div className="flex text-lg">
            {/* Question Number */}
            <div className="w-12 h-fit font-semibold underline">
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

      {/* SideBar */}
      <div className="col-span-3 px-5 pt-10">
        <div className="flex items-center gap-2 pt-1 text-black/80">
          <Clock4 size={40} />
          <div>
            <div className="text-xs leading-none">Your Time</div>
            <div className="text-2xl font-bold leading-none">0:10:55</div>
          </div>
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
