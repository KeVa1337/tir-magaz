import Link from "next/link";
import { SearchX } from "lucide-react";
import { SearchBox } from "@/components/shop/search-box";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-grid mx-auto grid max-w-2xl place-items-center px-4 py-20 text-center">
      <SearchX className="size-14 text-primary" />
      <p className="mt-4 font-num text-sm text-muted-foreground">Помилка 404</p>
      <h1 className="mt-1 text-3xl font-extrabold">Сторінку не знайдено</h1>
      <p className="mt-2 text-muted-foreground">Можливо, товар зняли з продажу або посилання застаріло. Спробуйте знайти деталь за номером:</p>
      <SearchBox className="mt-6 text-left" />
      <div className="mt-6 flex gap-2"><Button asChild><Link href="/catalog">До каталогу</Link></Button><Button asChild variant="outline"><Link href="/vin">Підбір за VIN</Link></Button></div>
    </div>
  );
}
