"use client";
import { sideBarPages } from "@/utils/sidebar-pages";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Spacer from "../spacer";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const SideBar = () => {
  const path = usePathname();

  // Hide sidebar on pre-auth pages
  if (
    path === "/" ||
    path.includes("/reset-password") ||
    path.includes("signup") ||
    path.includes("login")
  ) {
    return;
  }

  return (
    <div className="hidden lg:flex flex-col w-2/10 h-full shrink-0 border-r border-neutral-200 bg-background py-10 px-5 font-sans">
      <div className="h-fit">
        <h1 className="font-bold text-2xl text-accent font-serif">
          Oayastech C.B.T
        </h1>
        <Spacer size="md" />
      </div>

      {/* Sidebar Links */}
      <ul
        className={`grow flex flex-col gap-y-2 w-full ${
          path.includes("/exams") && path.length > 10
            ? "pointer-events-none"
            : ""
        }`}
      >
        {sideBarPages.map((item, key) => (
          <li key={key} className={`w-full h-fit`}>
            {/* Main Link */}
            <Link
              href={item.route}
              className={`h-10 flex items-center w-full gap-2 text-sm px-2 ${
                path.includes(item.route)
                  ? "border-l-4 border-accent bg-accent/2 text-accent font-semibold hover:bg-accent-light/70"
                  : "text-theme-gray hover:bg-theme-gray-light"
              } `}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>

            {/* Link Children */}
            {path.includes(item.route) && item.children ? (
              <div className="pl-8 mt-4 flex flex-col">
                {item.children.map((itemChild, key) => (
                  <Link
                    href={itemChild.route}
                    key={key}
                    className={`relative flex items-center text-sm ${
                      path.includes(itemChild.route)
                        ? "text-accent font-semibold"
                        : "text-theme-gray"
                    } hover:text-accent gap-2 mb-4`}
                  >
                    {itemChild?.icon}
                    <span>{itemChild.name}</span>

                    <div className="absolute -left-4 h-px w-2"></div>
                  </Link>
                ))}
              </div>
            ) : (
              ""
            )}
          </li>
        ))}
      </ul>

      <button
        className={`shrink-0 flex items-center gap-2 px-2 rounded-md h-10 w-full hover:bg-theme-gray-light cursor-pointer text-sm ${
          path.includes("/exams") && path.length > 10
            ? "pointer-events-none"
            : ""
        }`}
        onClick={() => {
          localStorage.removeItem("countdown_end_time");
          signOut({ redirectTo: "/" });
        }}
      >
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default SideBar;
