import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="flex items-center gap-3 px-4 py-4">
        <Link
          to="/"
          aria-label="Voltar"
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "#2e6b8a" }}>
          {titulo}
        </h1>
      </header>
      <div className="mx-4 mt-8 rounded-2xl bg-[#ffffff] p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
        <p className="text-lg font-bold" style={{ color: "#2e6b8a" }}>
          Em construção
        </p>
        <p className="mt-2 text-sm" style={{ color: "#5b7a8f" }}>
          Esta funcionalidade estará disponível em breve.
        </p>
      </div>
    </div>
  );
}
