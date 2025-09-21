import Table from "@/components/table";
import { assessmentTableData } from "@/utils/dummy-data";

const Exams = () => {
  const data = assessmentTableData.map((item, key) => [
    { value: item.name, colSpan: "col-span-1" },
    { value: item.sections, colSpan: "col-span-2" },
    { value: item.questions, colSpan: "col-span-2" },
    { value: item.due, colSpan: "col-span-3" },
    { value: item.students, colSpan: "col-span-2" },
    { value: item.status, colSpan: "col-span-1" },
    { value: item.pass, colSpan: "col-span-1" },
  ]);

  console.log(data);
  return (
    <div className="w-full h-full p-10 font-sans">
      <Table
        tableHeading={[
          { value: "Course", colSpan: "col-span-1" },
          { value: "Sections", colSpan: "col-span-2" },
          { value: "Questions", colSpan: "col-span-2" },
          { value: "Due Date", colSpan: "col-span-3" },
          { value: "Students", colSpan: "col-span-2" },
          { value: "Status", colSpan: "col-span-1" },
          { value: "Pass (%)", colSpan: "col-span-1" },
        ]}
        tableData={assessmentTableData.map((item, key) => [
          { value: item.name, colSpan: "col-span-1" },
          { value: item.sections, colSpan: "col-span-2" },
          { value: item.questions, colSpan: "col-span-2" },
          { value: item.due, colSpan: "col-span-3" },
          { value: item.students, colSpan: "col-span-2" },
          { value: item.status, colSpan: "col-span-1" },
          { value: item.pass, colSpan: "col-span-1" },
        ])}
        showSearch={false}
        showOptions={false}
      />
    </div>
  );
};

export default Exams;
