"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4 text-center">
      <div className="max-w-md">
        <TriangleAlert className="mx-auto size-12 text-warning" />
        <p className="mt-4 font-num text-sm text-muted-foreground">Помилка 500{error.digest ? ` · ${error.digest}` : ""}</p>
        <h1 className="mt-1 text-2xl font-extrabold">Щось пішло не так</h1>
        <p className="mt-2 text-muted-foreground">Ми вже знаємо про проблему. Спробуйте ще раз або зателефонуйте нам — допоможемо оформити замовлення.</p>
        <div className="mt-6 flex justify-center gap-2"><Button onClick={reset}>Спробувати ще раз</Button><Button asChild variant="outline"><Link href="/">На головну</Link></Button></div>
      </div>
    </div>
  );
}
