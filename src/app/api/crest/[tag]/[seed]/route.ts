import { crestSvg } from "@/lib/crest";

// Generated club crest (SVG) for clubs without an uploaded logo.
export async function GET(_req: Request, { params }: { params: Promise<{ tag: string; seed: string }> }) {
  const { tag, seed } = await params;
  return new Response(crestSvg(decodeURIComponent(tag), decodeURIComponent(seed)), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=604800, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
