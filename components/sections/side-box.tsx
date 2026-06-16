import Spacer from "../spacer";
import Image from "next/image";
import { getSchool } from "@/utils/schools";

const SideBox = ({ schoolName }: { schoolName?: string | null }) => {
  const school = getSchool(schoolName);

  return (
    <div className="hidden lg:col-span-6 lg:flex flex-col items-center justify-center bg-neutral-50">
      <Image
        src={school.image}
        width={270}
        height={270}
        alt="School logo"
        priority
        unoptimized
      />
      <Spacer size="lg" />

      <div className="w-8/10 flex flex-col items-center text-center">
        <div className="text-3xl font-extrabold leading-tight text-accent-dim w-2/3 font-serif">
          {school.name}
        </div>
        <Spacer size="sm" />
      </div>
    </div>
  );
};

export default SideBox;
