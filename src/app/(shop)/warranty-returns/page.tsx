import { StaticPage, staticMeta } from "@/components/shop/static-page";

export const generateMetadata = () => staticMeta("warranty-returns");

export default function Page() {
  return <StaticPage slug="warranty-returns" />;
}
