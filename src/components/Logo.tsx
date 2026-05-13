import { GraduationCap } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-gold">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold">Edo After School AI</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">SUBEB · Quality Education For All</div>
      </div>
    </div>
  );
}
