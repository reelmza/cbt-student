"use client";
import Button from "@/components/button";
import Input from "@/components/input";
import SideBox from "@/components/sections/side-box";
import { SecurityMonitor } from "@/components/security-monitor";
import Spacer from "@/components/spacer";
import { Key, MoveRight, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // User authentication logic
  // Login Logic
  const login = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      username: { value: string };
      password: { value: string };
    };

    setLoading("login");
    const res = await signIn("credentials", {
      username: target.username.value,
      password: target.password.value,
      loginClient: "student",
      redirect: false,
    });

    if (!res!.error) {
      toast.success("Login successfull.", {
        position: "bottom-left",
      });
      router.push("/exams");
      setLoading(null);
    }

    if (res!.error === "CredentialsSignin") {
      toast.error("Incorrect details provided.", {
        position: "bottom-left",
      });
      setLoading(null);
    }

    if (res!.error === "Configuration") {
      toast.error("An error occured, try again.", {
        position: "bottom-left",
      });
      setLoading(null);
    }
  };

  return (
    <div className="grid h-full w-full grid-cols-12 font-sans">
      {/* Side Box */}
      <SideBox />

      {/* Form Box */}
      <div className="col-span-12 lg:col-span-6 flex flex-col h-full">

        {/* Mobile branded header — hidden on desktop */}
        <div className="lg:hidden relative bg-accent-light flex flex-col items-center justify-center py-14 overflow-hidden shrink-0">
          {/* Dot pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(60,95,172,0.2) 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Gradient fade bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-accent-light to-transparent" />
          {/* Decorative rings */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full border-2 border-accent/20" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full border-2 border-accent/15" />
          <div className="absolute top-8 left-6 w-2.5 h-2.5 rounded-full bg-accent/25" />
          <div className="absolute bottom-10 right-10 w-2 h-2 rounded-full bg-accent/20" />
          <div className="absolute top-10 right-1/3 w-5 h-5 border border-accent/20 rotate-45" />

          {/* Branding */}
          <div className="relative z-10 text-center">
            <div className="text-xs font-semibold bg-accent text-white w-fit rounded-full px-3 py-1 leading-none mx-auto mb-4 tracking-wide">
              OYT Exams
            </div>
            <div className="text-2xl font-extrabold text-accent-dim leading-snug">
              OayasTech Student
              <br />
              Exam Portal
            </div>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center items-center px-5 lg:px-0">
          <div className="w-full lg:w-7/10 rounded-lg py-10 lg:py-0">
            {/* School Name — desktop only */}
            <div className="hidden lg:block text-sm font-sans font-semibold bg-accent-light text-accent-dim w-fit rounded-full px-3 mb-5 py-1 leading-none">
              OYT Exams
            </div>

            {/* Form Heading */}
            <div className="text-2xl font-bold mb-5 text-accent-dim">
              Login to your Exam.
            </div>

            <form onSubmit={login}>
              <Input
                name="username"
                type="text"
                placeholder="Enter your reg number"
                icon={<UserRound size={16} />}
              />
              <Spacer size="sm" />
              <Input
                name="password"
                type="password"
                placeholder="Enter your password"
                icon={<Key size={16} />}
              />
              <Spacer size="md" />

              <Button
                loading={loading == "login"}
                type="submit"
                title="Proceed to Exam"
                icon={<MoveRight size={20} strokeWidth={2} />}
                variant="fill"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
