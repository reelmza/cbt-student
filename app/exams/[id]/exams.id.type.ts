type QuestionType = {
  _id: string;
  type: string;
  question: string;
  options: { label: string; text: string }[];
}[];

type AnswerType = Record<
  string,
  {
    type: string;
    question: string;
    selectedOption?: string;
    subjectiveAnswers?: { slotNumber: number; answer?: string }[];
    theoryAnswer?: string;
  }
>;
type PageDataType = {
  timeLimit: number;
  title: string;
  course: { title: string };
};
