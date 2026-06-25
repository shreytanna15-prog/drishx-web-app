import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

async function proxyRequest(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const backendUrl = getBackendUrl();
  const targetPath = `/api/${path.join("/")}`;
  const targetUrl = `${backendUrl}${targetPath}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  const authorization = req.headers.get("authorization");

  if (contentType) headers.set("Content-Type", contentType);
  if (authorization) headers.set("Authorization", authorization);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
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

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
