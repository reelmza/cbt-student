import PageNavigator from "@/components/sections/page-navigator";
import Spacer from "@/components/spacer";

const Page = () => {
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
      Completed
    </div>
  );
};

export default Page;
