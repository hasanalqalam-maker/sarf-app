import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * Landing point for the links in Supabase auth emails (signup confirmation,
 * password recovery, email change). Exchanges the one-time code / token for a
 * session, sets the cookies, then forwards to `next` (default "/").
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get('next'));
  const supabase = await createSupabaseServerClient();

  // PKCE flow — ?code=...
  const code = searchParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error
      ? redirectWithError(origin, error.message)
      : NextResponse.redirect(`${origin}${next}`);
  }

  // OTP / magic-link flow — ?token_hash=...&type=...
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'recovery' | 'email' | 'magiclink' | 'invite',
      token_hash: tokenHash,
    });
    return error
      ? redirectWithError(origin, error.message)
      : NextResponse.redirect(`${origin}${next}`);
  }

  return redirectWithError(origin, 'missing_code');
}

function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

function redirectWithError(origin: string, message: string): NextResponse {
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
}
