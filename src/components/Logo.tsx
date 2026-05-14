import logo from "@/assets/edo-subeb-logo.png";

export function Logo({ className = "", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src={logo} alt="Edo SUBEB logo" className="h-11 w-11 object-contain" />
      {showText && (
        <div className="leading-tight">
          <div className="text-base font-extrabold tracking-tight">Digital Learning at Home</div>
          <div className="text-[10px] uppercase tracking-wider opacity-70">SUBEB · Quality Education For All</div>
        </div>
      )}
    </div>
  );
}
