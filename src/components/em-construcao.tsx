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
          style={{ background: "#D5DCE8", color: "#1B3A6B" }}
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "#1B3A6B" }}>
          {titulo}
        </h1>
      </header>
      <div className="mx-4 mt-8 rounded-2xl bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <p className="text-lg font-bold" style={{ color: "#1B3A6B" }}>
          Em construção
        </p>
        <p className="mt-2 text-sm" style={{ color: "#8A9BB5" }}>
          Esta funcionalidade estará disponível em breve.
        </p>
      </div>
    </div>
  );
}
