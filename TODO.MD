

CREAR EL FRONTEND, USAR COOKIES, CONFIGURAR EL JWT Y LO QUE HAGA FALTA PARA MANDAR LAS COOKIES


1. El Puente: Actualizar el Backend (NestJS)
Antes de ir al frontend, tu servidor tiene que saber leer la cookie que le va a llegar.

[ ] Instalar cookie-parser: npm install cookie-parser.

[ ] Actualizar main.ts:

TypeScript
app.use(cookieParser());
app.enableCors({
  origin: 'http://localhost:3000', // El puerto por defecto de Next.js
  credentials: true,
});
[ ] Actualizar JwtStrategy: Modifica el extractor para que busque en las cookies.

TypeScript
// En el constructor de tu JwtStrategy
jwtFromRequest: ExtractJwt.fromExtractors([
  (req: any) => {
    return req?.cookies?.jwt || null; // El nombre 'jwt' debe coincidir con el de la cookie
  },
  ExtractJwt.fromAuthHeaderAsBearerToken(), // Mantenemos este por si usas Postman
]),
2. El Corazón: Auth en Next.js
En Next.js no solo usas un "Context", sino que aprovechas el Middleware para proteger rutas antes de que el usuario vea la pantalla en blanco.

[ ] Crear la Instancia de Axios (o Fetch):

Configura withCredentials: true para que Next.js incluya la cookie automáticamente en cada petición hacia NestJS.

[ ] Implementar el AuthContext:

Debe manejar el estado del usuario (user, status).

Al montar el componente (useEffect), llamar a /auth/check-status.

[ ] Manejo de Cookies en el Server (Opcional pero Pro):

Si haces peticiones desde Server Components, recuerda que las cookies no se envían solas. Tendrás que extraerlas con cookies() de next/headers y pasarlas manualmente a tu API de NestJS.

3. La Seguridad: Next.js Middleware
Esta es la parte que te hará sentir como un arquitecto senior. El Middleware de Next.js se ejecuta antes de renderizar cualquier página.

[ ] Crear middleware.ts en la raíz:

Revisar si existe la cookie jwt.

Si el usuario intenta entrar a /dashboard y no hay cookie, redirigir a /login.

Si ya hay un usuario logueado e intenta ir a /login, enviarlo directamente al panel de control.

4. Flujo de Trabajo para Mañana (Orden de Ataque)
Backend Primero: Asegúrate de que al hacer login en Postman, en la pestaña "Cookies" aparezca tu cookie jwt.

Next.js Login: Crea el formulario simple. Si el login es exitoso, verás que la cookie aparece en las DevTools del navegador automáticamente. No tienes que guardar nada en el código.

Check Status: Crea un componente que muestre el nombre del usuario obtenido desde la API. Si recargas la página y el nombre sigue ahí, ¡lo lograste!

💡 Un detalle de "Ingeniero" para Next.js
Como vas a usar cookies HttpOnly, tu frontend no puede "saber" si el usuario está logueado simplemente mirando el almacenamiento local. Dependerás de la respuesta del servidor (check-status) o de una cookie técnica adicional (no HttpOnly) que solo sirva para indicar "hay una sesión activa", pero que no contenga el token real.