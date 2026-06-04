import { cn } from "@/lib/utils";

export default function PageShell({
  children,
  className,
  narrow,
  wide,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={cn("flex flex-1 flex-col p-4 sm:p-6", className)}>
      <div
        className={cn(
          "mx-auto w-full",
          narrow && "max-w-xl",
          wide && "max-w-6xl",
          !narrow && !wide && "max-w-2xl",
        )}
      >
        {children}
      </div>
    </div>
  );
}
