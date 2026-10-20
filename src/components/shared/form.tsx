"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SubmitButton({ children, pendingText, ...props }: React.ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <Loader2 className="animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}

export function Field({ label, htmlFor, error, hint, children, className, required }: {
  label?: string; htmlFor?: string; error?: string[] | string; hint?: string; children: React.ReactNode; className?: string; required?: boolean;
}) {
  const msg = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-danger"> *</span>}
        </Label>
      )}
      {children}
      {msg ? <p className="text-xs font-medium text-danger">{msg}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function FormMessage({ state }: { state?: { error?: string; message?: string } }) {
  if (state?.error) return <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{state.error}</p>;
  if (state?.message) return <p role="status" className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success">{state.message}</p>;
  return null;
}
