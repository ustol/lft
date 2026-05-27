"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { lifeSpan } from "@/lib/utils/dateUtils";
import { PersonAvatar } from "./PersonAvatar";
import { Badge } from "@/components/ui/badge";
import type { PersonRow, PhotoRow } from "@/types/database";

interface PersonCardProps {
  person: PersonRow;
  primaryPhoto?: PhotoRow | null;
  className?: string;
  onClick?: () => void;
  /** Show edit link in the card footer */
  showActions?: boolean;
}

export function PersonCard({
  person,
  primaryPhoto,
  className,
  onClick,
  showActions = false,
}: PersonCardProps) {
  const span = lifeSpan(person.date_of_birth, person.date_of_death);
  const isDeceased = person.status === "deceased";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className={cn(
        "group bg-card rounded-2xl border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Primary photo banner */}
      {primaryPhoto && (
        <div className="h-24 overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primaryPhoto.url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>
      )}

      <div className={cn("p-4", primaryPhoto && "-mt-5 relative")}>
        {/* Avatar + name row */}
        <div className="flex items-start gap-3">
          <PersonAvatar
            firstName={person.first_name}
            surname={person.surname}
            photoUrl={primaryPhoto?.url}
            size={primaryPhoto ? "md" : "sm"}
            status={person.status}
            className={primaryPhoto ? "ring-2 ring-card" : ""}
          />
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-display font-semibold text-foreground text-base leading-tight truncate">
              {person.first_name}{" "}
              {person.middle_names ? `${person.middle_names} ` : ""}
              {person.surname}
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {person.lftid}
            </p>
          </div>
          {isDeceased && (
            <Badge variant="secondary" className="text-[10px] flex-shrink-0 mt-0.5">
              Deceased
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-3 space-y-1.5">
          {span && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{span}</span>
            </div>
          )}
          {person.place_of_birth && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{person.place_of_birth}</span>
            </div>
          )}
        </div>

        {/* Actions footer */}
        {showActions && (
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-end gap-2">
            <Link
              href={`/person/${person.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Edit <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
