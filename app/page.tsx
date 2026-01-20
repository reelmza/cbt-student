"use client";
import Button from "@/components/button";
import Input from "@/components/input";
import SideBox from "@/components/sections/side-box";
import Spacer from "@/components/spacer";
import { Key, MoveRight, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
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
      <div className="col-span-6 flex flex-col justify-center items-center">
        <div className="w-7/10 rounded-lg">
          {/* School Name */}
          <div className="text-sm font-sans font-semibold bg-accent-light text-accent-dim w-fit  rounded-full px-3 mb-5 py-1 leading-none">
            EBSU, Ebonyi.
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

            <div className="flex items-center text-sm text-accent-dim">
              Forgot password?
              <Link
                href="/reset-password"
                className="ml-1 inline-block text-accent"
              >
                Reset Here.
              </Link>
            </div>
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
  );
}
