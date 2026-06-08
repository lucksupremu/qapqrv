import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { getStoredMode, setThemeMode, type ThemeMode } from "@/lib/theme";

const OPTIONS: { value: ThemeMode; label: string; Icon: typeof Monitor }[] = [
  { value: "auto", label: "Auto", Icon: Monitor },
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Escuro", Icon: Moon },
];

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("auto");

  useEffect(() => {
    setMode(getStoredMode());
  }, []);

  const handlePick = (next: ThemeMode) => {
    setMode(next);
    setThemeMode(next);
  };

  return (
    <div
      className="rounded-[16px] border-2 p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border-soft)" }}
    >
      <p className="text-[14px] font-bold" style={{ color: "var(--text-dark)" }}>
        Tema
      </p>
      <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted-fg)" }}>
        Escolha como o app deve aparecer. "Auto" segue o sistema do celular.
      </p>

      <div
        role="radiogroup"
        aria-label="Tema do aplicativo"
        className="mt-3 grid grid-cols-3 gap-2"
      >
        {OPTIONS.map(({ value, label, Icon }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              role="radio"
              aria-checked={active}
              onClick={() => handlePick(value)}
              className="flex flex-col items-center gap-1.5 rounded-[12px] border-2 py-3 text-[12px] font-bold transition active:scale-[0.97]"
              style={{
                background: active ? "var(--primary)" : "var(--surface-2)",
                borderColor: active ? "var(--primary)" : "var(--border-soft)",
                color: active ? "var(--text-white)" : "var(--text-dark)",
              }}
            >
              <Icon size={20} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
