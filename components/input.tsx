import React, { JSX, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type InputProps = {
  name: string;
  type: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  size?: "big" | "small";
  required?: boolean;
  disabled?: boolean;
  icon?: JSX.Element;
  error?: string;
  autoComplete?: string;
  id?: string;
};

const Input = ({
  name,
  type,
  value,
  onChange,
  placeholder,
  label,
  size,
  required,
  disabled,
  icon,
  error,
  autoComplete,
  id: idProp,
}: InputProps) => {
  const generated = useId();
  const id = idProp ?? generated;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-accent-dim mb-1.5"
        >
          {label}
          {required && (
            <span className="text-theme-error ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div
        className={[
          "group w-full flex items-center gap-2.5 px-3 rounded-lg border transition-all duration-200",
          !size || size === "small" ? "h-12 lg:h-10" : "h-14 lg:h-12",
          error
            ? "border-theme-error/50 bg-theme-error/5 ring-2 ring-theme-error/10"
            : "border-transparent bg-accent-light/70 focus-within:bg-white focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20",
          disabled ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {icon && (
          <span
            className={`shrink-0 transition-colors duration-200 ${
              error
                ? "text-theme-error/60"
                : "text-theme-gray-dim group-focus-within:text-accent"
            }`}
          >
            {icon}
          </span>
        )}
        <input
          id={id}
          name={name}
          type={isPassword ? (revealed ? "text" : "password") : type}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className="grow h-full text-base outline-none text-accent-dim placeholder:text-theme-gray-dim bg-transparent disabled:cursor-not-allowed"
          value={value}
          onChange={onChange}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="shrink-0 text-theme-gray-dim hover:text-accent-dim transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded"
            aria-label={revealed ? "Hide password" : "Show password"}
          >
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-theme-error leading-snug" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
