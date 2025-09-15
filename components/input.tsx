import React, { JSX } from "react";
type InputType = {
  placeholder: string;
  icon: JSX.Element;
};

const Input = ({ placeholder, icon }: InputType) => {
  return (
    <div
      className={`w-full h-12 flex items-center border border-accent-light rounded-md overflow-hidden`}
    >
      {/* Input Icon */}
      {icon ? (
        <div className="flex items-center justify-center h-full w-12 bg-accent-light text-accent-dim">
          {icon}
        </div>
      ) : (
        ""
      )}
      <input
        placeholder={placeholder || "Some input"}
        className="h-full text-sm outline-none px-3 text-accent-dim"
      />
    </div>
  );
};

export default Input;
