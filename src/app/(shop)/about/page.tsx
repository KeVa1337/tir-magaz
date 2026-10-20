import { StaticPage, staticMeta } from "@/components/shop/static-page";

export const generateMetadata = () => staticMeta("about");

export default function Page() {
  return <StaticPage slug="about" />;
}
