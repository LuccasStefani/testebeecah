import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { r2, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/src/lib/r2/client";
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized)
    return NextResponse.json({ error: "Não autorizado" }, { status: auth.status });
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const bannerId = form.get("bannerId");
    if (
      !(file instanceof File) ||
      typeof bannerId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(bannerId)
    )
      return NextResponse.json(
        { error: "Selecione uma imagem para o banner." },
        { status: 400 },
      );
    const types: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    if (!types[file.type] || !file.size || file.size > 10 * 1024 * 1024)
      return NextResponse.json(
        { error: "Use JPG, PNG ou WebP de até 10 MB." },
        { status: 400 },
      );
    const buffer = Buffer.from(await file.arrayBuffer());
    const valid =
      file.type === "image/jpeg"
        ? buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
        : file.type === "image/png"
          ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : buffer.toString("ascii", 0, 4) === "RIFF" &&
            buffer.toString("ascii", 8, 12) === "WEBP";
    if (!valid)
      return NextResponse.json(
        { error: "O arquivo não corresponde a uma imagem válida." },
        { status: 400 },
      );
    const key =
      "banners/" + bannerId + "/" + crypto.randomUUID() + "." + types[file.type];
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return NextResponse.json({ imageUrl: R2_PUBLIC_URL.replace(/\/$/, "") + "/" + key });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível enviar a imagem. Tente novamente." },
      { status: 500 },
    );
  }
}
