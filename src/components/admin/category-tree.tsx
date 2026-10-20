"use client";

import * as React from "react";
import { useActionState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCategoryAction, reorderCategoriesAction, saveCategoryAction } from "@/server/actions/admin";
import { CategoryIcon } from "@/components/shared/icons";
import { Field, FormMessage, SubmitButton } from "@/components/shared/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Input, NativeSelect } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ActionState } from "@/lib/validators";
import { cn } from "@/lib/utils";

interface Cat { id: string; name: string; slug: string; icon: string | null; description: string | null; isActive: boolean; parentId: string | null; count: number; children: Cat[] }

const ICONS = ["engine", "disc", "wind", "spring", "cabin", "gear", "bolt", "link", "axle", "droplet", "kit"];

function Row({ cat, roots, depth, children }: { cat: Cat; roots: Cat[]; depth: number; children?: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const [pending, start] = React.useTransition();
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("rounded-lg", isDragging && "relative z-10 opacity-80 shadow-xl")}>
      <div className={cn("flex min-w-0 items-center gap-2 rounded-lg border bg-card px-2 py-2", depth && "ml-4 sm:ml-8", !cat.isActive && "opacity-60")}>
        <button className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing" aria-label={`Перетягнути ${cat.name}`} {...attributes} {...listeners}><GripVertical className="size-4" /></button>
        <CategoryIcon icon={cat.icon} className="size-4 text-primary" />
        <span className="min-w-0 truncate font-semibold">{cat.name}</span>
        <span className="font-num text-xs text-muted-foreground max-sm:hidden">/{cat.slug}</span>
        {!cat.isActive && <Badge tone="red">прихована</Badge>}
        <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">{cat.count} тов.</span>
        <CategoryDialog cat={cat} roots={roots} trigger={<Button size="icon-sm" variant="ghost" aria-label="Редагувати"><Pencil /></Button>} />
        <Button size="icon-sm" variant="ghost" className="text-danger" disabled={pending} aria-label="Видалити" onClick={() => start(async () => { const r = await deleteCategoryAction(cat.id); if (!r.ok) toast.error(r.error); else toast.success("Видалено"); })}><Trash2 /></Button>
      </div>
      {children}
    </li>
  );
}

function SortableList({ items, parentId, roots, depth }: { items: Cat[]; parentId: string | null; roots: Cat[]; depth: number }) {
  const [order, setOrder] = React.useState(items);
  const [prevItems, setPrevItems] = React.useState(items);
  if (items !== prevItems) {
    // нові дані з сервера після revalidate
    setPrevItems(items);
    setOrder(items);
  }
  const dndId = React.useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const next = arrayMove(order, order.findIndex((c) => c.id === e.active.id), order.findIndex((c) => c.id === e.over!.id));
    setOrder(next);
    const r = await reorderCategoriesAction(parentId, next.map((c) => c.id));
    if (!r.ok) toast.error(r.error);
  };
  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
      <SortableContext items={order.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul className={cn("grid gap-1.5", depth && "mt-1.5")}>
          {order.map((c) => (
            <Row key={c.id} cat={c} roots={roots} depth={depth}>
              {c.children.length > 0 && <SortableList items={c.children} parentId={c.id} roots={roots} depth={depth + 1} />}
            </Row>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export function CategoryDialog({ cat, roots, trigger }: { cat?: Cat; roots: Cat[]; trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [state, action] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const res = await saveCategoryAction(prev, fd);
    if (res.ok) { setOpen(false); toast.success("Категорію збережено"); }
    return res;
  }, {});
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{cat ? "Редагувати категорію" : "Нова категорія"}</DialogTitle>
        <form action={action} className="grid gap-3">
          {cat && <input type="hidden" name="id" value={cat.id} />}
          <Field label="Назва" error={state.fieldErrors?.name} required><Input name="name" defaultValue={cat?.name} /></Field>
          <Field label="Slug (URL)" hint="Порожньо — з назви"><Input name="slug" defaultValue={cat?.slug} className="font-num" /></Field>
          <Field label="Батьківська категорія">
            <NativeSelect name="parentId" defaultValue={cat?.parentId ?? ""}>
              <option value="">— коренева —</option>
              {roots.filter((r) => r.id !== cat?.id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </NativeSelect>
          </Field>
          <Field label="Іконка">
            <NativeSelect name="icon" defaultValue={cat?.icon ?? ""}><option value="">—</option>{ICONS.map((i) => <option key={i}>{i}</option>)}</NativeSelect>
          </Field>
          <Field label="Опис"><Input name="description" defaultValue={cat?.description ?? ""} /></Field>
          <label className="flex items-center gap-2 text-sm font-semibold"><Checkbox name="isActive" defaultChecked={cat?.isActive ?? true} /> Показувати на сайті</label>
          <FormMessage state={state} />
          <SubmitButton>Зберегти</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryTree({ tree }: { tree: Cat[] }) {
  return (
    <div className="grid gap-4">
      <div><CategoryDialog roots={tree} trigger={<Button><Plus /> Нова категорія</Button>} /></div>
      <SortableList items={tree} parentId={null} roots={tree} depth={0} />
    </div>
  );
}
