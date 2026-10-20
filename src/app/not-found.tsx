import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-num text-sm text-muted-foreground">404</p>
        <h1 className="mt-1 text-3xl font-extrabold">Сторінку не знайдено</h1>
        <Link href="/" className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 font-bold text-primary-foreground">На головну</Link>
      </div>
    </div>
  );
}
