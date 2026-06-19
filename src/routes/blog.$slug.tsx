import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { POSTS, getPost, type BlogPost } from "@/lib/blog";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) {
      return {
        meta: [
          { title: "Artigo não encontrado — QAP, QRV!" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title: `${post.title} — Blog QAP, QRV!` },
        { name: "description", content: post.description },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.description },
        {
          property: "og:url",
          content: `https://miketools.top/blog/${post.slug}`,
        },
        { property: "og:type", content: "article" },
      ],
      links: [
        {
          rel: "canonical",
          href: `https://miketools.top/blog/${post.slug}`,
        },
      ],
    };
  },
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  component: BlogPostScreen,
});

function BlogPostScreen() {
  const { post } = Route.useLoaderData();
  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      <header className="flex items-center gap-3 px-4 py-4">
        <Link
          to="/blog"
          aria-label="Voltar para o blog"
          className="flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95"
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <ArrowLeft size={22} />
        </Link>
        <Link to="/blog" className="text-sm font-semibold" style={{ color: "#2e6b8a" }}>
          Blog
        </Link>
      </header>

      <article className="mx-auto max-w-2xl px-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2e6b8a]">
          {post.category}
        </span>
        <h1 className="mt-2 text-[26px] font-extrabold leading-tight text-slate-800">
          {post.title}
        </h1>
        <p className="mt-2 text-[15px] text-slate-600">{post.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </time>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {post.readingMinutes} min de leitura
          </span>
        </div>

        <div className="mt-6 space-y-4 text-[15.5px] leading-[1.7] text-slate-700">
          {post.body.map((block: BlogPost["body"][number], i: number) => {
            if (typeof block === "string") {
              return <p key={i}>{block}</p>;
            }
            if ("h" in block) {
              return (
                <h2
                  key={i}
                  className="mt-6 text-[18px] font-extrabold text-slate-800"
                >
                  {block.h}
                </h2>
              );
            }
            return (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {block.list.map((item: string, j: number) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          })}
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[17px] font-bold text-slate-800">Leia também</h2>
            <ul className="mt-3 space-y-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: r.slug }}
                    className="block rounded-[12px] bg-white p-3 text-[14px] font-semibold text-slate-700 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description: post.description,
              datePublished: post.publishedAt,
              author: { "@type": "Organization", name: "QAP, QRV!" },
              publisher: {
                "@type": "Organization",
                name: "QAP, QRV!",
                url: "https://miketools.top",
              },
              mainEntityOfPage: `https://miketools.top/blog/${post.slug}`,
            }),
          }}
        />
      </article>
    </div>
  );
}
