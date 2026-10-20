import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold [&>svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-muted-foreground",
        green: "border-success/30 bg-success/10 text-success",
        amber: "border-warning/30 bg-warning/10 text-warning",
        red: "border-danger/30 bg-danger/10 text-danger",
        blue: "border-info/30 bg-info/10 text-info",
        primary: "border-transparent bg-primary text-primary-foreground",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({ className, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}
