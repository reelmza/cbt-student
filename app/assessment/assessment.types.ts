type AssesmentApiResponse = {
  _id: string;
  title: string;
  dueDate: string;
  totalMarks: number;
  status: string;
  students: [];
  sections: [{ questions: [] }];
};
