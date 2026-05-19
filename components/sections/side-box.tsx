import Spacer from "../spacer";
import Image from "next/image";

import boxImage from "@/public/images/students_collage_x.png";
const SideBox = () => {
  return (
    <div className="hidden lf:flex lg:col-span-6 bg-accent-light flex-col items-center justify-center">
      <Image
        src={boxImage}
        width={320}
        height={320}
        alt="School logo"
        priority
      />
      <Spacer size="lg" />

      <div className="w-8/10 text-accent-dim text-center">
        <div className="text-3xl font-extrabold leading-tight text-accent-dim">
          OayasTech Student <br />
          Exam Portal
        </div>
        <Spacer size="sm" />
        {/* <p className="text-lg">Examination Portal</p> */}
      </div>
    </div>
  );
};

export default SideBox;
