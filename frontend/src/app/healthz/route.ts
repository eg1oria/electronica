/** Для Docker HEALTHCHECK: отвечает, даже если API недоступно. */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" });
}
