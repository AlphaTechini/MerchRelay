export function jsonError(error) {
  const status = error.message?.includes("requires") ? 503 : 400;
  return Response.json(
    { error: error.message || "The request could not be completed." },
    { status },
  );
}

export async function readRequestBody(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return request.json();

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}
