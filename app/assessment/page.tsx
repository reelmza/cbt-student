"use client";
import Button from "@/components/button";
import PageNavigator from "@/components/sections/page-navigator";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import TableSearchBox from "@/components/table-searchbox";
import { attachHeaders, localAxios } from "@/lib/axios";
import { assessmentTableData } from "@/utils/dummy-data";
import { Plus } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const Page = () => {
  const controller = new AbortController();
  const [loading, setLoading] = useState<string | null>(null);
  const { data: session } = useSession();
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    if (!session) return;

    const getAssessments = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get("/school/assessments", {
          signal: controller.signal,
        });

        if (res.status === 201) {
          console.log(res.data.data.assessments);
          setPageData(res.data.data.assessments);
        }

        setLoading(null);
      } catch (error: any) {
        if (error.name !== "CanceledError") {
          setLoading("pageError");
          console.log(error);
        }
      }
    };

    !pageData && getAssessments();

    return () => {
      controller.abort();
    };
  }, [session]);

  return (
    <div className="w-full h-full p-10 font-sans">
      <PageNavigator
        navList={[
          { name: "All Assessment", route: "/assessment" },
          { name: "Completed", route: "/assessment/complete" },
          { name: "Pending", route: "/assessment/pending" },
        ]}
      />
      <Spacer size="lg" />

      <div className="flex items-center justify-between">
        <TableSearchBox placeholder="Search an assessment" />

        <Link href="/assessment/create" className="block w-52">
          <Button
            title={"Create an Assessment"}
            loading={false}
            variant={"fill"}
            icon={<Plus size={16} />}
          />
        </Link>
      </div>
      <Table
        tableHeading={[
          { value: "Course", colSpan: "col-span-3" },
          { value: "Due Date", colSpan: "col-span-3" },
          { value: "Sections", colSpan: "col-span-1" },
          { value: "Questions", colSpan: "col-span-1" },
          { value: "Students", colSpan: "col-span-1" },
          { value: "Pass (%)", colSpan: "col-span-1" },
          { value: "Status", colSpan: "col-span-1" },
          { value: "Actions", colSpan: "col-span-1" },
        ]}
        tableData={assessmentTableData.map((item, key) => [
          { value: item.name, colSpan: "col-span-3" },
          { value: item.due, colSpan: "col-span-3" },
          { value: item.sections, colSpan: "col-span-1" },
          { value: item.questions, colSpan: "col-span-1" },
          { value: item.students, colSpan: "col-span-1" },
          { value: item.pass, colSpan: "col-span-1" },
          {
            value: item.status,
            colSpan: "col-span-1",
            type: "badge",
            color: `${
              item.status === "Pending"
                ? "warning"
                : item.status === "Ongoing"
                ? "info"
                : "success"
            }`,
          },
          { value: key, colSpan: "col-span-1", type: "link" },
        ])}
        showSearch={false}
        showOptions={false}
      />
    </div>
  );
};

const Exams = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};

export default Exams;
