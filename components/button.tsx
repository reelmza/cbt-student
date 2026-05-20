import { JSX } from "react";
import { Spinner } from "./ui/spinner";

type ButtonType = {
  title: string;
  loading: boolean;
  variant:
    | "fill"
    | "outline"
    | "fillError"
    | "fillErrorOutline"
    | "fillErrorGhost";
  icon?: JSX.Element;
  type?: "submit" | "button";
  onClick?: () => void;
};

const Button = ({
  title,
  type,
  loading,
  icon,
  variant,
  onClick,
}: ButtonType) => {
  const base =
    "flex items-center justify-center h-12 lg:h-10 w-full font-semibold rounded-lg leading-none gap-2 cursor-pointer select-none transition duration-150 ease-out text-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const buttonVariants = {
    fill: `${base} bg-accent text-white hover:bg-accent-dim focus-visible:ring-accent/50${
      loading ? " opacity-60 pointer-events-none" : ""
    }`,
    fillError: `${base} bg-theme-error text-white hover:opacity-90 focus-visible:ring-theme-error/50${
      loading ? " opacity-60 pointer-events-none" : ""
    }`,
    fillErrorOutline: `${base} border border-theme-error/50 text-theme-error bg-transparent hover:bg-theme-error/8 focus-visible:ring-theme-error/40${
      loading ? " opacity-60 pointer-events-none" : ""
    }`,
    fillErrorGhost: `${base} text-theme-error bg-transparent hover:bg-theme-error/8 focus-visible:ring-theme-error/40${
      loading ? " opacity-60 pointer-events-none" : ""
    }`,
    outline: `${base} bg-transparent text-accent-dim border border-accent/25 hover:bg-accent-light focus-visible:ring-accent/30${
      loading ? " opacity-60 pointer-events-none" : ""
    }`,
  };

  return (
    <button
      type={type || "submit"}
      className={buttonVariants[variant]}
      disabled={loading}
      onClick={onClick}
    >
      <span>{title}</span>
      {loading ? <Spinner /> : icon}
    </button>
  );
};

export default Button;
