"use client";

import * as React from "react";
import { Check, RotateCcw } from "lucide-react";
import { setCallbackStatusAction } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";

export function CallbackStatusButton({ id, done }: { id: string; done: boolean }) {
  const [pending, start] = React.useTransition();
  return (
    <Button size="sm" variant={done ? "ghost" : "success"} disabled={pending} onClick={() => start(async () => { await setCallbackStatusAction(id, done ? "NEW" : "DONE"); })}>
      {done ? <><RotateCcw /> Повернути</> : <><Check /> Опрацьовано</>}
    </Button>
  );
}
