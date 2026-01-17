type PageDataType = {
  course: {
    code: string;
    title: string;
  };
  status: string;
  totalMarks: number;
  timeLimit: number;
  sections: { questions: [] }[];
};
