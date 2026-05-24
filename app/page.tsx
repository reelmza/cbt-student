"use client";
import Button from "@/components/button";
import Input from "@/components/input";
import SideBox from "@/components/sections/side-box";
import Spacer from "@/components/spacer";
import { Key, MoveRight, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

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
      toast.success("Login successful.", { position: "bottom-left" });
      router.push("/exams");
      setLoading(null);
    }

    if (res!.error === "CredentialsSignin") {
      toast.error(
        "Incorrect details. Check your registration number and password.",
        {
          position: "bottom-left",
        },
      );
      setLoading(null);
    }

    if (res!.error === "Configuration") {
      toast.error("Something went wrong. Please try again.", {
        position: "bottom-left",
      });
      setLoading(null);
    }
  };

  return (
    <div className="grid h-full w-full grid-cols-12 font-sans">
      <SideBox />

      {/* Form side */}
      <div className="col-span-12 lg:col-span-6 flex flex-col h-full">
        {/* Mobile branded header */}
        <div className="lg:hidden bg-accent-dim flex flex-col items-center justify-center py-12 shrink-0 gap-3">
          <div className="text-xs font-semibold bg-white/15 text-white/90 w-fit rounded-full px-3.5 py-1.5 leading-none tracking-wide">
            Welcome
          </div>
          <div className="text-2xl font-extrabold text-white font-serif text-center leading-tight px-8">
            OayasTech <br />
            Exam Portal
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 lg:px-0">
          <div className="w-full max-w-sm lg:max-w-none lg:w-3/5">
            {/* Badge — desktop only */}
            <div className="hidden lg:block text-xs font-semibold bg-accent-light text-accent-dim w-fit rounded-full px-3.5 mb-6 py-1.5 leading-none">
              Welcome
            </div>

            {/* Heading */}
            <div className="text-3xl font-bold font-serif leading-tight text-balance mb-1.5 text-accent-dim">
              Sign in to your exam
            </div>
            <div className="text-sm text-theme-gray mb-7 leading-relaxed max-w-[52ch] text-pretty">
              Use the username and password provided by your exam coordinator.
            </div>

            <form onSubmit={login}>
              <Input
                name="username"
                type="text"
                placeholder="Registration number"
                icon={<UserRound size={16} />}
              />
              <Spacer size="sm" />
              <Input
                name="password"
                type="password"
                placeholder="Password"
                icon={<Key size={16} />}
              />
              <Spacer size="md" />
              <Button
                loading={loading === "login"}
                type="submit"
                title="Proceed to Exam"
                icon={<MoveRight size={20} strokeWidth={2} />}
                variant="fill"
              />
            </form>

            <div className="mt-10 text-xs text-theme-gray-dim">
              OayasTech CBT Platform &middot; v2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
