import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Toaster } from "sonner";
import { themeInitScript } from "@/components/shared/theme";
import { DemoPanelServer } from "@/components/shared/demo-panel-server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "TIR Parts — запчастини для тягачів і напівпричепів", template: "%s · TIR Parts" },
  description:
    "Запчастини для DAF, MAN, Volvo, Scania, Mercedes-Benz, Renault, Iveco та напівпричепів з осями BPW/SAF/ROR. Підбір за VIN і номером шасі, гараж авто, комплекти ТО.",
  openGraph: { type: "website", locale: "uk_UA", siteName: "TIR Parts" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0c0f" },
    { media: "(prefers-color-scheme: light)", color: "#f1f4f7" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <DemoPanelServer />
        <Toaster position="top-center" richColors closeButton theme="system" />
      </body>
    </html>
  );
}
