import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization');

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050/api';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const response = await fetch(`${backendUrl}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error in proxy orders route:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal Server Error',
        error: {
          code: 'PROXY_ERROR',
          details: error.stack || null,
        },
      },
      { status: 500 }
    );
  }
}
