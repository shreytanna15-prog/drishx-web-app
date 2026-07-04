import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

/** Proxy wholesale bulk add-to-cart to the backend /api/cart/bulk endpoint. */
export async function POST(req: NextRequest) {
  const backendUrl = getBackendUrl();
  const targetUrl = `${backendUrl}/api/cart/bulk`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  const authorization = req.headers.get("authorization");

  if (contentType) headers.set("Content-Type", contentType);
  if (authorization) headers.set("Authorization", authorization);

  try {
    const body = await req.text();
    const backendRes = await fetch(targetUrl, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });

    const responseBody = await backendRes.text();
    const responseHeaders = new Headers();
    const responseContentType = backendRes.headers.get("content-type");

    if (responseContentType) {
      responseHeaders.set("Content-Type", responseContentType);
    }

    return new NextResponse(responseBody, {
      status: backendRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach backend server";

    return NextResponse.json(
      {
        error: `Cannot connect to backend at ${backendUrl}. Make sure Drishx-admin-and-backend is running.`,
        details: message,
      },
      { status: 502 }
    );
  }
}
