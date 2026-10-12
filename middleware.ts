import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Obtener la sesión o cookie de autenticación de Supabase
    const hasAuthToken = request.cookies
        .getAll()
        .some((cookie) => 
            (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) ||
            cookie.name === 'sb-auth-token'
        );

    // 2. Definir rutas públicas y privadas
    const isLoginPage = pathname === '/login';

    const isProtectedRoute =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin');

    // CASO 1: Usuario NO autenticado intentando entrar a ruta privada
    // Como Chituk usa AuthModal en lugar de página /login, redirigimos a / con ?auth=login
    if (!hasAuthToken && isProtectedRoute) {
        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('auth', 'login');
        return NextResponse.redirect(redirectUrl);
    }

    // CASO 2: Usuario YA autenticado intentando entrar al login
    if (hasAuthToken && isLoginPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // En cualquier otro caso (rutas públicas o navegación normal), permitir el paso
    return NextResponse.next();
}

// 3. Matcher optimizado: ignora estáticos, imágenes, favicon y recursos comunes
export const config = {
    matcher: [
        /*
         * Coincide con todas las rutas excepto las que comienzan con:
         * - _next/static (archivos estáticos de JS/CSS)
         * - _next/image (optimización de imágenes)
         * - favicon.ico (icono del sitio)
         * - extensiones de archivos estáticos (svg, png, jpg, jpeg, gif, webp, ico, css, js)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
    ],
};
