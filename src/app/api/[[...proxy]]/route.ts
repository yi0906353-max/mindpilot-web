import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY = process.env.API_GATEWAY || 'http://localhost';

async function proxyRequest(request: NextRequest, path: string) {
  const url = `${API_GATEWAY}/api/${path}`;
  const headers = new Headers();

  // 转发必要的 headers
  for (const [key, value] of request.headers.entries()) {
    if (['content-type', 'authorization', 'x-user-id'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  // 转发请求体（非 GET/HEAD 请求）
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(url, init);
    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Proxy error: ${error.message}` },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  const { proxy } = await params;
  return proxyRequest(request, (proxy || []).join('/'));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  const { proxy } = await params;
  return proxyRequest(request, (proxy || []).join('/'));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  const { proxy } = await params;
  return proxyRequest(request, (proxy || []).join('/'));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  const { proxy } = await params;
  return proxyRequest(request, (proxy || []).join('/'));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  const { proxy } = await params;
  return proxyRequest(request, (proxy || []).join('/'));
}
