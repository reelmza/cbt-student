type QuestionType = {
  _id: string;
  type: "multiple_choice" | "multiple_select" | "theory" | "subjective";
  question: string;
  options: { label: string; text: string; _id: string }[];
  correctAnswers?: string[];
  // Single entry holding one or two comma separated urls ("url1,url2")
  images?: string[];
}[];

type AnswerType = Record<
  string,
  {
    type: string;
    question: string;
    selectedOption?: string;
    selectedOptions?: string[];
    subjectiveAnswers?: { slotNumber: number; answer?: string }[];
    theoryAnswer?: string;
  }
>;
type PageDataType = {
  sections: {}[];
  term: number;
  instruction: string;
  session: string;
  timeLimit: number;
  title: string;
  course: { title: string };
  totalMarks: string;
  shuffleQuestions: string[];
  allowBrowserRestriction: boolean;
};
