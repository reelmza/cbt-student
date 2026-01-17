"use client";
import { SessionProvider, useSession } from "next-auth/react";

const Page = () => {
  const { data: session } = useSession();
  console.log(session);
  return <div className="grow min-h-full p-10 font-sans">Page goes here</div>;
};

const PageWrapper = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};

export default PageWrapper;
