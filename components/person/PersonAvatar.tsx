"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PersonAvatarProps {
  firstName: string;
  surname: string;
  photoUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  status?: "alive" | "deceased";
}

const SIZE_MAP = {
  xs: "w-7 h-7 text-[10px]",
  sm: "w-9 h-9 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-base",
  xl: "w-24 h-24 text-xl",
};

export function PersonAvatar({
  firstName,
  surname,
  photoUrl,
  size = "md",
  className,
  status,
}: PersonAvatarProps) {
  const initials = [firstName[0], surname[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <Avatar className={cn(SIZE_MAP[size], "ring-2 ring-background shadow-sm")}>
        <AvatarImage src={photoUrl ?? undefined} alt={`${firstName} ${surname}`} className="object-cover" />
        <AvatarFallback className="lft-gradient text-white font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
            status === "alive" ? "status-alive" : "status-deceased"
          )}
        />
      )}
    </div>
  );
}
