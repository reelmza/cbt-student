import Spacer from "../spacer";
import Image from "next/image";
import studentsCollage from "@/public/school-logo.png";
const SideBox = () => {
  return (
    <div className="col-span-6 bg-accent-light/50 flex flex-col items-center justify-center">
      <Image
        src={studentsCollage}
        width={250}
        height={0}
        alt="Sauki CBT"
        className="aspect-square flex"
      />
      <Spacer size="md" />

      <div className="w-8/10 text-accent-dim text-center">
        <div className="text-3xl font-bold leading-tight">
          Built for Schools, <br />
          Trusted by Educators.
        </div>
        <Spacer size="sm" />
        <p className="text-xs leading-normal">
          Register confidently with a platform designed specifically for
          education institutions.
        </p>
      </div>
    </div>
  );
};

export default SideBox;
