import { NotebookPen } from "lucide-react";
import { JSX } from "react";

type SideBarStructure = {
  name: string;
  route: string;
  icon: JSX.Element;
};

type SideBarPageType = {
  name: string;
  route: string;
  icon: JSX.Element;
  children?: SideBarStructure[];
};
export const sideBarPages: SideBarPageType[] = [
  {
    name: "Exams",
    route: "/exams",
    icon: <NotebookPen size={18} />,
  },
  // {
  //   name: "Users",
  //   route: "/users",
  //   icon: <UserRound size={18} />,
  //   // children: [
  //   //   { name: "Staff", route: "/users", icon: <UsersRound size={16} /> },
  //   //   {
  //   //     name: "Students",
  //   //     route: "/students",
  //   //     icon: <GraduationCap size={16} />,
  //   //   },
  //   // ],
  // },
];
