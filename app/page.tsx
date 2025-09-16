import Button from "@/components/button";
import Input from "@/components/input";
import SideBox from "@/components/sections/side-box";
import Spacer from "@/components/spacer";
import { Key, Lock, MoveRight, UserRound } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid h-full grid-cols-12 font-sans">
      {/* Side Box */}
      <SideBox />

      {/* Form Box */}
      <div className="col-span-6 flex flex-col justify-center items-center">
        <div className="w-5/10 bg-reds-50 rounded-lg">
          {/* School Name */}
          <div className="text-sm font-sans font-semibold bg-accent-light text-accent-dim w-fit  rounded-full px-3 mb-5 py-1 leading-none">
            Adamawa State University, Mubi.
          </div>

          {/* Form Heading */}
          <div className="text-2xl font-bold mb-5 text-accent-dim">
            Login to your Exam.
          </div>

          <form>
            <Input
              placeholder="Enter your username"
              icon={<UserRound size={16} />}
            />
            <Spacer size="sm" />
            <Input placeholder="Enter your password" icon={<Key size={16} />} />

            <Spacer size="lg" />
            <Button
              title="Proceed to Exam"
              icon={<MoveRight size={20} strokeWidth={2} />}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
