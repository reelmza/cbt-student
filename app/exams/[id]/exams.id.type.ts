type QuestionType = {
  _id: string;
  type: "multiple_choice" | "multiple_select" | "theory" | "subjective";
  question: string;
  options: { label: string; text: string; _id: string }[];
  correctAnswers?: string[];
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
