import { StaticPage, staticMeta } from "@/components/shop/static-page";

export const generateMetadata = () => staticMeta("delivery-payment");

export default function Page() {
  return <StaticPage slug="delivery-payment" />;
}
