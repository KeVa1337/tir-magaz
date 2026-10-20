"use client";

import * as React from "react";
import { useActionState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBannerAction, deleteFaqAction, saveBannerAction, saveFaqAction, savePageAction } from "@/server/actions/admin";
import { DeleteButton, FormDialog } from "./form-dialog";
import { Field, FormMessage, SubmitButton } from "@/components/shared/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ActionState } from "@/lib/validators";

interface Banner { id: string; title: string; subtitle: string | null; link: string | null; linkText: string | null; imageUrl: string | null; sort: number; isActive: boolean }
interface Page { id: string; slug: string; title: string; content: string }
interface Faq { id: string; question: string; answer: string; sort: number; isActive: boolean }

const edit = <Button type="button" size="icon-sm" variant="ghost" aria-label="Редагувати"><Pencil /></Button>;
const del = <Button type="button" size="icon-sm" variant="ghost" className="text-danger" aria-label="Видалити"><Trash2 /></Button>;

function BannerFields({ b }: { b?: Banner }) {
  return (
    <>
      {b && <input type="hidden" name="id" value={b.id} />}
      <Field label="Заголовок" required><Input name="title" defaultValue={b?.title} /></Field>
      <Field label="Підзаголовок"><Input name="subtitle" defaultValue={b?.subtitle ?? ""} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Посилання"><Input name="link" defaultValue={b?.link ?? ""} placeholder="/vin" /></Field>
        <Field label="Текст кнопки"><Input name="linkText" defaultValue={b?.linkText ?? ""} /></Field>
      </div>
      <Field label="Зображення (URL)" hint="Необов'язково"><Input name="imageUrl" defaultValue={b?.imageUrl ?? ""} /></Field>
      <div className="grid grid-cols-2 items-end gap-2">
        <Field label="Порядок"><Input name="sort" defaultValue={b?.sort ?? 0} inputMode="numeric" /></Field>
        <label className="flex h-10 items-center gap-2 text-sm font-semibold"><Checkbox name="isActive" defaultChecked={b?.isActive ?? true} /> Активний</label>
      </div>
    </>
  );
}

function FaqFields({ f }: { f?: Faq }) {
  return (
    <>
      {f && <input type="hidden" name="id" value={f.id} />}
      <Field label="Питання" required><Input name="question" defaultValue={f?.question} /></Field>
      <Field label="Відповідь" required><Textarea name="answer" rows={4} defaultValue={f?.answer} /></Field>
      <div className="grid grid-cols-2 items-end gap-2">
        <Field label="Порядок"><Input name="sort" defaultValue={f?.sort ?? 0} inputMode="numeric" /></Field>
        <label className="flex h-10 items-center gap-2 text-sm font-semibold"><Checkbox name="isActive" defaultChecked={f?.isActive ?? true} /> Показувати</label>
      </div>
    </>
  );
}

function PageEditor({ pages }: { pages: Page[] }) {
  const [id, setId] = React.useState(pages[0]?.id ?? "");
  const page = pages.find((p) => p.id === id);
  const [state, action] = useActionState<ActionState, FormData>(savePageAction, {});
  React.useEffect(() => { if (state.ok) toast.success("Сторінку збережено"); }, [state]);
  return (
    <div className="grid gap-3">
      <NativeSelect value={id} onChange={(e) => setId(e.target.value)} className="max-w-sm" aria-label="Сторінка">
        {pages.map((p) => <option key={p.id} value={p.id}>{p.title} (/{p.slug})</option>)}
        <option value="">+ Нова сторінка</option>
      </NativeSelect>
      <form key={id} action={action} className="grid gap-3">
        {page && <input type="hidden" name="id" value={page.id} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Заголовок" required><Input name="title" defaultValue={page?.title} /></Field>
          <Field label="Slug" required hint="Сторінки about, contacts, delivery-payment, warranty-returns вже підключені до сайту"><Input name="slug" defaultValue={page?.slug} className="font-num" /></Field>
        </div>
        <Field label="Вміст" hint="## Заголовок, - список, **жирний**, > примітка. Порожній рядок — новий абзац.">
          <Textarea name="content" rows={16} defaultValue={page?.content} className="font-num text-sm" />
        </Field>
        <FormMessage state={{ error: state.error }} />
        <SubmitButton className="justify-self-start">Зберегти сторінку</SubmitButton>
      </form>
    </div>
  );
}

export function ContentManager({ banners, pages, faq }: { banners: Banner[]; pages: Page[]; faq: Faq[] }) {
  return (
    <Tabs defaultValue="banners">
      <TabsList>
        <TabsTrigger value="banners">Банери головної</TabsTrigger>
        <TabsTrigger value="pages">Сторінки</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
      </TabsList>
      <TabsContent value="banners" className="grid gap-3">
        <div><FormDialog title="Новий банер" action={saveBannerAction} trigger={<Button><Plus /> Банер</Button>}><BannerFields /></FormDialog></div>
        {banners.map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <span className="font-num text-xs text-muted-foreground">#{b.sort}</span>
            <div className="min-w-0 flex-1"><p className="font-bold">{b.title} {!b.isActive && <Badge tone="red">вимкнено</Badge>}</p><p className="truncate text-sm text-muted-foreground">{b.subtitle} → {b.link}</p></div>
            <FormDialog title="Банер" action={saveBannerAction} trigger={edit}><BannerFields b={b} /></FormDialog>
            <DeleteButton onDelete={() => deleteBannerAction(b.id)} label="Видалити банер?">{del}</DeleteButton>
          </div>
        ))}
      </TabsContent>
      <TabsContent value="pages"><PageEditor pages={pages} /></TabsContent>
      <TabsContent value="faq" className="grid gap-3">
        <div><FormDialog title="Нове питання" action={saveFaqAction} trigger={<Button><Plus /> Питання</Button>}><FaqFields /></FormDialog></div>
        {faq.map((f) => (
          <div key={f.id} className="flex items-start gap-3 rounded-xl border bg-card p-4">
            <div className="min-w-0 flex-1"><p className="font-bold">{f.question} {!f.isActive && <Badge tone="red">приховано</Badge>}</p><p className="text-sm text-muted-foreground">{f.answer}</p></div>
            <FormDialog title="Питання" action={saveFaqAction} trigger={edit}><FaqFields f={f} /></FormDialog>
            <DeleteButton onDelete={() => deleteFaqAction(f.id)} label="Видалити питання?">{del}</DeleteButton>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}
