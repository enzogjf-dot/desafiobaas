import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// MIDDLEWARE DE AUTENTICAÇÃO — BUG 02 🐛
// ---------------------------------------------------------------------------
// O que está acontecendo: usuários que NÃO estão logados conseguem acessar
// o dashboard e criar personagens normalmente. A proteção de rotas não funciona!
//
// Por quê? A condição abaixo está INVERTIDA. O código lê:
//   "SE o usuário TEM sessão → redireciona para /login"
// Mas deveria ser:
//   "SE o usuário NÃO TEM sessão → redireciona para /login"
//
// CORREÇÃO: troque if (token) por if (!token) — o ponto de exclamação
// faz toda a diferença aqui.
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const token = request.cookies.get("__session")?.value;

  const rotasProtegidas = ["/dashboard", "/criar-personagem", "/personagem"];
  const estaNaRotaProtegida = rotasProtegidas.some((r) =>
    request.nextUrl.pathname.startsWith(r)
  );

  if (estaNaRotaProtegida) {
    if (!token) {
  return NextResponse.redirect(new URL("/login", request.url));
}
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/criar-personagem/:path*",
    "/personagem/:path*",
  ],
};
