import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const contentType = req.headers.get('content-type') || '';

  let username = '';
  let password = '';

  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    username = body.username || '';
    password = body.password || '';
  } else {
    const form = await req.formData();
    username = String(form.get('username') || '');
    password = String(form.get('password') || '');
  }

  const ok =
    username === (process.env.ADMIN_USER || 'admin') &&
    password === (process.env.ADMIN_PASS || 'password123');

  if (!ok) {
    return NextResponse.redirect(new URL('/login?error=1', url), { status: 302 });
  }

  const res = NextResponse.redirect(new URL('/admin', url), { status: 302 });
  res.cookies.set('admin_auth', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return res;
}
