import type { Bloco } from "@/content/tipos";

export function ArticleBody({ blocks }: { blocks: Bloco[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (typeof b === "string") {
          return (
            <p key={i} className="text-[15px] leading-relaxed text-foreground/85">
              {b}
            </p>
          );
        }
        if ("h" in b) {
          const id = slugify(b.h);
          return (
            <h2
              key={i}
              id={id}
              className="scroll-mt-24 pt-2 text-[19px] font-bold text-foreground"
            >
              {b.h}
            </h2>
          );
        }
        if ("list" in b) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 text-[15px] text-foreground/85">
              {b.list.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        if ("quote" in b) {
          return (
            <blockquote
              key={i}
              className="border-l-4 border-primary/50 bg-muted/40 px-4 py-2 italic text-foreground/80"
            >
              {b.quote}
            </blockquote>
          );
        }
        return null;
      })}
    </div>
  );
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
