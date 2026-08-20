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
  const cookie = req.headers.get("cookie");

  if (contentType) headers.set("Content-Type", contentType);
  if (authorization) headers.set("Authorization", authorization);
  if (cookie && targetPath.startsWith("/api/auth/")) headers.set("Cookie", cookie);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  try {
    let body: BodyInit | undefined;
    if (hasBody) {
      body = contentType?.includes("multipart/form-data")
        ? await req.arrayBuffer()
        : await req.text();
    }

    const backendRes = await fetch(targetUrl, {
      method: req.method,
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

    backendRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie" && targetPath.startsWith("/api/auth/")) {
        responseHeaders.append("Set-Cookie", value);
      }
    });

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
