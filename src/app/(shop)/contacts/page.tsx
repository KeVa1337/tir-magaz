import { ContactsBlock, StaticPage, staticMeta } from "@/components/shop/static-page";

export const generateMetadata = () => staticMeta("contacts");

export default function Page() {
  return (
    <StaticPage slug="contacts">
      <ContactsBlock />
    </StaticPage>
  );
}
