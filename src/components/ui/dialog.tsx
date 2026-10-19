"use client";

import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({ className, children, ...props }: React.ComponentProps<typeof D.Content>) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <D.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border bg-popover p-6 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        <D.Close className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100" aria-label="Закрити">
          <X className="size-5" />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}
export function DialogTitle({ className, ...props }: React.ComponentProps<typeof D.Title>) {
  return <D.Title className={cn("pr-8 text-lg font-bold", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.ComponentProps<typeof D.Description>) {
  return <D.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

/** Бокова панель (мобільне меню, фільтри). */
export function SheetContent({ className, children, side = "left", title, ...props }: React.ComponentProps<typeof D.Content> & { side?: "left" | "right" | "bottom"; title: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <D.Content
        className={cn(
          "fixed z-50 flex flex-col gap-4 overflow-y-auto bg-background p-5 shadow-2xl transition data-[state=open]:animate-in data-[state=closed]:animate-out",
          side === "left" && "inset-y-0 left-0 w-[86%] max-w-sm border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
          side === "right" && "inset-y-0 right-0 w-[86%] max-w-sm border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <D.Title className="text-lg font-bold">{title}</D.Title>
          <D.Close className="rounded-md p-2 hover:bg-accent" aria-label="Закрити">
            <X className="size-5" />
          </D.Close>
        </div>
        <D.Description className="sr-only">{title}</D.Description>
        {children}
      </D.Content>
    </D.Portal>
  );
}
