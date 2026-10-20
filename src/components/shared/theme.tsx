"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "tir-theme";

/** Скрипт у <head>: ставить клас теми до першого рендеру, щоб не було «спалаху». */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${KEY}");if(!t){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.style.colorScheme=t}catch(e){document.documentElement.classList.add("dark")}})()`;

export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.classList.contains("dark") ? "light" : "dark";
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* приватний режим */
    }
  };
  return (
    <Button variant="ghost" size="icon" className={className} aria-label="Перемкнути тему" title="Світла / темна тема" onClick={toggle}>
      <Sun className="hidden size-5 dark:block" />
      <Moon className="size-5 dark:hidden" />
    </Button>
  );
}
