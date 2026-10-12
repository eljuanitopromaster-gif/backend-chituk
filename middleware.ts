import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Obtener la sesión o cookie de autenticación de Supabase
    // Supabase almacena el token en cookies con prefijo "sb-"
    const hasAuthToken = request.cookies
        .getAll()
        .some((cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'));

    // 2. Definir rutas públicas y privadas
    const isLoginPage = pathname === '/login';
    const isPublicRoute =
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/herramientas') ||
        pathname.startsWith('/comunidad') ||
        pathname.startsWith('/juegos') ||
        pathname.startsWith('/privacidad') ||
        pathname.startsWith('/terminos') ||
        pathname.startsWith('/api/');

    const isProtectedRoute =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/publicar');

    // CASO 1: Usuario NO autenticado intentando entrar a ruta privada
    if (!hasAuthToken && isProtectedRoute) {
        const redirectUrl = new URL('/login', request.url);
        // Guardamos la ruta a la que intentaba ir para redirigirlo tras iniciar sesión
        redirectUrl.searchParams.set('redirectTo', pathname);
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
