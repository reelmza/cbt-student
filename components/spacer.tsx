import React from "react";

const Spacer = ({ size }: { size: "xs" | "sm" | "md" | "lg" | "xl" }) => {
  if (size === "xs") {
    return <div className="w-full h-1"></div>;
  }

  if (size === "sm") {
    return <div className="w-full h-2"></div>;
  }

  if (size === "md") {
    return <div className="w-full h-4"></div>;
  }

  if (size === "lg") {
    return <div className="w-full h-6"></div>;
  }

  if (size === "xl") {
    return <div className="w-full h-10"></div>;
  }
};

export default Spacer;
