import {
  BellDot,
  Cog,
  GaugeCircle,
  GraduationCap,
  Library,
  Shield,
  UserRound,
  UsersRound,
} from "lucide-react";

export const sideBarPages = [
  {
    name: "Dashboard",
    route: "/dashboard",
    icon: <GaugeCircle size={18} />,
  },
  {
    name: "Users",
    route: "/users",
    icon: <UserRound size={18} />,
    children: [
      { name: "Staff", route: "/staff", icon: <UsersRound size={16} /> },
      {
        name: "Students",
        route: "/students",
        icon: <GraduationCap size={16} />,
      },
    ],
  },
  {
    name: "Exams",
    route: "/exams",
    icon: <Library size={18} />,
  },
  {
    name: "Notifications",
    route: "/notifications",
    icon: <BellDot size={18} />,
  },

  {
    name: "Security",
    route: "/security",
    icon: <Shield size={18} />,
  },
  {
    name: "Settings",
    route: "/settings",
    icon: <Cog size={18} />,
  },
];
