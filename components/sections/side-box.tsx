import Image from "next/image";
import boxImage from "@/public/images/students_collage_x.png";

const SideBox = () => {
  return (
    <div className="hidden lg:flex lg:col-span-6 flex-col relative overflow-hidden bg-accent-dim">
      {/* Heading block */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-8">
        <div className="text-white/40 text-xs font-semibold mb-3 tracking-widest uppercase lg:mt-10">
          OayasTech
        </div>
        <h1 className="text-white text-4xl xl:text-[2.75rem] font-extrabold leading-[1.1] font-serif max-w-xs">
          Oayastech <br />
          Exam Portal
        </h1>
        <p className="mt-4 text-white/55 text-sm leading-relaxed max-w-[280px]">
          Timed, secure assessments for OayasTech-affiliated institutions.
        </p>
      </div>

      {/* Student collage — sits at the bottom, bleeds upward */}
      <div className="relative z-10 px-6 flex items-end justify-center">
        <Image
          src={boxImage}
          width={380}
          height={300}
          alt="Students"
          priority
          className="w-full max-w-[380px]"
        />
      </div>

      {/* Fade image into panel background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20 z-20 pointer-events-none"
        style={{ background: "linear-gradient(to top, #23306d, transparent)" }}
      />
    </div>
  );
};

export default SideBox;
