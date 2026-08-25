import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

async function proxyAuthRequest(req: NextRequest, action: string) {
  const backendUrl = getBackendUrl();
  const targetUrl = `${backendUrl}/api/auth/${action}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  const authorization = req.headers.get("authorization");
  const cookie = req.headers.get("cookie");
  const xClient = req.headers.get("x-client");
  const requestId = req.headers.get("x-request-id");

  if (contentType) headers.set("Content-Type", contentType);
  if (authorization) headers.set("Authorization", authorization);
  if (cookie) headers.set("Cookie", cookie);
  if (xClient) headers.set("X-Client", xClient);
  if (requestId) headers.set("X-Request-Id", requestId);

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
      if (key.toLowerCase() === "set-cookie") {
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  const { action } = await context.params;
  return proxyAuthRequest(req, action);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  const { action } = await context.params;
  return proxyAuthRequest(req, action);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  const { action } = await context.params;
  return proxyAuthRequest(req, action);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  const { action } = await context.params;
  return proxyAuthRequest(req, action);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  const { action } = await context.params;
  return proxyAuthRequest(req, action);
}
