import { ArrowRight, ChevronRight } from "lucide-react";
import React from "react";
type ButtonType = {
  title: string;
};
const Button = ({ title }: ButtonType) => {
  return (
    <button className="flex items-center justify-center h-10 w-[10rem] bg-accent text-white font-semibold rounded-md leading-0 gap-2">
      <span>{title}</span>
      <ArrowRight size={20} />
    </button>
  );
};

export default Button;
