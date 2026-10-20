"use client";

import { useSyncExternalStore } from "react";

/** Списки товарів у браузері (обране, переглянуті) — працюють і для гостей. */
export type ListKey = "tir-fav" | "tir-recent";
const LIMIT: Record<ListKey, number> = { "tir-fav": 100, "tir-recent": 16 };
const EMPTY: string[] = [];
const cache = new Map<ListKey, { raw: string | null; value: string[] }>();
const listeners = new Set<() => void>();

function read(key: ListKey): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return EMPTY;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value;
  let value: string[] = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    value = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : EMPTY;
  } catch {
    value = EMPTY;
  }
  cache.set(key, { raw, value });
  return value;
}

function write(key: ListKey, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids.slice(0, LIMIT[key])));
  } catch {
    /* сховище недоступне */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = () => cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLocalList(key: ListKey) {
  return useSyncExternalStore(subscribe, () => read(key), () => EMPTY);
}

export function toggleInList(key: ListKey, id: string) {
  const cur = read(key);
  write(key, cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur]);
}

export function pushRecent(id: string) {
  const cur = read("tir-recent");
  if (cur[0] === id) return;
  write("tir-recent", [id, ...cur.filter((x) => x !== id)]);
}
