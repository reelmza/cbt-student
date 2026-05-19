import Spacer from "../spacer";
import Image from "next/image";

import boxImage from "@/public/images/students_collage_x.png";

const SideBox = () => {
  return (
    <div className="hidden lg:flex lg:col-span-6 bg-accent-light flex-col items-center justify-center relative overflow-hidden">
      {/* Dot grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(60,95,172,0.22) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Gradient fade — bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-accent-light to-transparent" />

      {/* Decorative ring — top right */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full border-2 border-accent/20" />
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full border border-accent/15" />

      {/* Decorative ring — bottom left */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full border-2 border-accent/20" />
      <div className="absolute -bottom-6 -left-6 w-36 h-36 rounded-full border border-accent/15" />

      {/* Small accent dots */}
      <div className="absolute top-12 left-12 w-3 h-3 rounded-full bg-accent/30" />
      <div className="absolute top-8 left-24 w-2 h-2 rounded-full bg-accent/20" />
      <div className="absolute bottom-20 right-16 w-3 h-3 rounded-full bg-accent/25" />

      {/* Rotated squares */}
      <div className="absolute top-16 right-1/4 w-7 h-7 border-2 border-accent/20 rotate-45" />
      <div className="absolute bottom-24 left-1/4 w-5 h-5 border-2 border-accent/15 rotate-45" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
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
        </div>
      </div>
    </div>
  );
};

export default SideBox;
