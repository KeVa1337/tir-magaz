"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** Номери (артикули, OE, VIN) — моноширинним шрифтом і з кнопкою «копіювати» (SPEC §11). */
export function PartNumber({ value, className, copy = true, size = "sm" }: { value: string; className?: string; copy?: boolean; size?: "xs" | "sm" | "base" | "lg" }) {
  const [done, setDone] = React.useState(false);
  const onCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    } catch {
      /* буфер обміну недоступний */
    }
  };
  return (
    <span className={cn("inline-flex items-center gap-1 font-num", { xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg" }[size], className)}>
      <span className="break-all">{value}</span>
      {copy && (
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={`Копіювати ${value}`}
          title="Копіювати"
        >
          {done ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        </button>
      )}
    </span>
  );
}
