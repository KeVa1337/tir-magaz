"use client";

import * as React from "react";
import { MessageCircle, Phone, PhoneCall, Send, X } from "lucide-react";
import { CallbackDialog } from "./quick-forms";
import { cn } from "@/lib/utils";

/** Плаваюча кнопка зв'язку: Telegram, Viber, дзвінок, «передзвоніть». */
export function ContactFab({ phone, telegram }: { phone: string; telegram?: string }) {
  const [open, setOpen] = React.useState(false);
  const tel = phone.replace(/[^\d+]/g, "");
  const tg = telegram?.replace(/^@/, "");
  const item = "flex items-center gap-3 rounded-full border bg-popover py-2 pr-4 pl-2 text-sm font-semibold shadow-lg hover:bg-accent";
  return (
    <div className="fixed right-3 bottom-20 z-40 flex flex-col items-end gap-2 sm:right-4 sm:bottom-4 print:hidden">
      {open && (
        <div className="flex flex-col items-end gap-2">
          {tg && (
            <a href={`https://t.me/${tg}`} target="_blank" rel="noreferrer" className={item}>
              <span className="flex size-9 items-center justify-center rounded-full bg-[#2aa1da] text-white"><Send className="size-4.5" /></span> Telegram
            </a>
          )}
          <a href={`viber://chat?number=${encodeURIComponent(tel)}`} className={item}>
            <span className="flex size-9 items-center justify-center rounded-full bg-[#7360f2] text-white"><MessageCircle className="size-4.5" /></span> Viber
          </a>
          <a href={`tel:${tel}`} className={item}>
            <span className="flex size-9 items-center justify-center rounded-full bg-success text-white"><Phone className="size-4.5" /></span> <span className="font-num">{phone}</span>
          </a>
          <CallbackDialog trigger={
            <button className={cn(item, "cursor-pointer")}>
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground"><PhoneCall className="size-4.5" /></span> Передзвоніть мені
            </button>
          } />
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Закрити контакти" : "Зв'язатися з нами"}
        className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_-6px_rgba(255,176,32,0.7)] transition-transform hover:scale-105">
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}
