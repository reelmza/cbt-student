"use client";
import { SessionProvider, useSession } from "next-auth/react";

const Page = () => {
  const { data: session } = useSession();
  console.log(session);

  return (
    <div className="grow min-h-full p-10 font-sans">
      <div className="p-10 bg-accent rounded-xl">
        <div className="text-3xl font-extrabold text-white">
          {session?.user.name}
        </div>
        <div className="text-accent-light font-semibold">
          {session?.user.email}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};
export default Dashboard;
