import { Headset, User } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ThreadMessage {
  id: string; text: string; isStaff: boolean; attachments: string[]; createdAt: Date; author: { name: string | null } | null;
}

/** Тред повідомлень VIN-запиту. viewer визначає, чиї повідомлення праворуч. */
export function VinMessages({ messages, viewer }: { messages: ThreadMessage[]; viewer: "customer" | "staff" }) {
  return (
    <ol className="grid gap-4">
      {messages.map((m) => {
        const mine = viewer === "staff" ? m.isStaff : !m.isStaff;
        return (
          <li key={m.id} className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", m.isStaff ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
              {m.isStaff ? <Headset className="size-4" /> : <User className="size-4" />}
            </span>
            <div className={cn("max-w-[85%] rounded-xl border px-3.5 py-2.5", mine ? "bg-primary/10" : "bg-card")}>
              <p className="text-xs text-muted-foreground"><b className="text-foreground">{m.author?.name ?? (m.isStaff ? "Менеджер" : "Гість")}</b> · {formatDateTime(m.createdAt)}</p>
              <p className="mt-1 text-sm whitespace-pre-line">{m.text}</p>
              {m.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.attachments.map((a) => (
                    <a key={a} href={a} target="_blank" rel="noreferrer" className="block size-16 overflow-hidden rounded-md border">
                      {a.endsWith(".pdf") ? <span className="flex h-full items-center justify-center text-xs font-bold">PDF</span> : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a} alt="Вкладення" className="h-full w-full object-cover" />
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
