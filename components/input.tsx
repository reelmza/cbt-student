import React from "react";
type InputType = {
  placeholder: string;
};
const Input = ({ placeholder }: InputType) => {
  return (
    <input
      placeholder={placeholder || "Some input"}
      className="w-full h-10 border border-gray-200 outline-none rounded-md px-3"
    />
  );
};

export default Input;
