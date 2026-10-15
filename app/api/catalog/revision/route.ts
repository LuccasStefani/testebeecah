import { getCatalog } from "@/src/lib/catalog";
import { catalogRevision } from "@/src/lib/catalog-revision";

export const dynamic = "force-dynamic";

export async function GET() {
  const { products, failed } = await getCatalog();
  if (failed)
    return Response.json(
      { error: "Catálogo indisponível" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  // Only a fingerprint is exposed; the catalog query keeps the existing RLS.
  return Response.json(
    { revision: catalogRevision(products) },
    {
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
