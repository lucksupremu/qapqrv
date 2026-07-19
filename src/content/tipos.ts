export type Bloco =
  | string
  | { h: string }
  | { list: string[] }
  | { quote: string };

export type Artigo = {
  slug: string;
  title: string;
  subtitle: string;
  category: CategoriaSlug;
  date: string; // ISO
  readingMinutes: number;
  author: string;
  toc: string[]; // list of section headings (auto-derived, but explicit for SSR-friendly)
  body: Bloco[];
  faq?: { q: string; a: string }[];
  related?: string[]; // slugs
};

export type Categoria = {
  slug: CategoriaSlug;
  title: string;
  description: string;
  icon: string; // lucide name
};

export type CategoriaSlug =
  | "dejem"
  | "delegada"
  | "escalas"
  | "procedimentos"
  | "produtividade"
  | "ferramentas"
  | "tecnologia"
  | "pmesp"
  | "seguranca-digital";
