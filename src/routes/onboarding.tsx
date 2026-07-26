import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Bell, ChevronRight, Check } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Bem-vindo — MIKE TOOLS" }] }),
  component: OnboardingScreen,
});

const ONBOARDING_KEY = "onboarding-seen-v1";

export function markOnboardingSeen() {
  try {
    window.localStorage.setItem(ONBOARDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return true;
  }
}

// Onboarding enxuto: 2 telas — funcionalidade principal + permissões.
const slides = [
  {
    icon: Calendar,
    title: "Controle suas escalas",
    desc: "Marque dejem e delegada, veja no calendário, receba lembretes e some o valor do mês.",
    bullets: [
      "Calendário visual com soma mensal",
      "Lembretes 1 dia antes + 2h antes",
      "Salve escalas para abrir offline",
    ],
  },
  {
    icon: Bell,
    title: "Ative os lembretes",
    desc: "No próximo passo, autorize notificações para receber avisos das suas escalas mesmo com o app fechado.",
    bullets: ["Notificações (essencial)", "Localização só quando você abrir a ferramenta", "Seus dados ficam no aparelho"],
  },
];

function OnboardingScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const slide = slides[step];
  const Icon = slide.icon;
  const isLast = step === slides.length - 1;

  const finish = () => {
    markOnboardingSeen();
    void navigate({ to: "/" });
  };

  const next = () => {
    if (isLast) finish();
    else setStep((s) => s + 1);
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-8" style={{ background: "var(--bg)" }}>
      <div className="flex justify-end">
        <button
          onClick={finish}
          className="text-[13px] font-semibold"
          style={{ color: "var(--muted-fg, #5b7a8f)" }}
        >
          Pular
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
          style={{ background: "var(--surface)", color: "var(--primary, #2e6b8a)" }}
        >
          <Icon size={48} />
        </div>
        <h1 className="text-[26px] font-bold" style={{ color: "var(--text-dark)" }}>
          {slide.title}
        </h1>
        <p className="mt-3 max-w-[320px] text-[15px]" style={{ color: "var(--muted-fg, #5b7a8f)" }}>
          {slide.desc}
        </p>
        <ul className="mt-6 max-w-[320px] space-y-2 text-left">
          {slide.bullets.map((b) => (
            <li
              key={b}
              className="flex items-center gap-2 text-[14px]"
              style={{ color: "var(--text-dark)" }}
            >
              <Check size={18} style={{ color: "var(--primary, #2e6b8a)" }} />
              {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex justify-center gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === step ? 28 : 8,
                background:
                  i === step ? "var(--primary, #2e6b8a)" : "var(--border-soft, #e8f0f8)",
              }}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] font-bold text-white"
          style={{ background: "var(--primary, #2e6b8a)" }}
        >
          {isLast ? "Começar" : "Próximo"}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
