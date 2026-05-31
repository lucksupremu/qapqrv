import { useCallback, useEffect, useState } from "react";

function read(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, list: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function useFavorites() {
  const KEY = "qapqrv:favorites";
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    setList(read(KEY));
  }, []);

  const toggle = useCallback((slug: string) => {
    setList((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      write(KEY, next);
      return next;
    });
  }, []);

  const isFav = useCallback((slug: string) => list.includes(slug), [list]);

  return { favorites: list, toggle, isFav };
}

export function useHistory() {
  const KEY = "qapqrv:history";
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    setList(read(KEY));
  }, []);

  const push = useCallback((slug: string) => {
    const current = read(KEY);
    const next = [slug, ...current.filter((s) => s !== slug)].slice(0, 20);
    write(KEY, next);
    setList(next);
  }, []);

  const clear = useCallback(() => {
    write(KEY, []);
    setList([]);
  }, []);

  return { history: list, push, clear };
}
