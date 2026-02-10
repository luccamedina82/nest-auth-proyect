## **PARTE I: BACKEND (Nest.js)**

### **Step B1: Corregir errores de compilación**

**Archivo**: autenticacion/src/auth/auth.controller.ts  
**Qué hay**: Hay una `u` suelta después de `checkAuthStatus`  
**Qué hacer**:
```typescript
// ANTES (línea 32-39):
@Get('check-status')
@Auth()
checkAuthStatus(
    @GetUser() user: User
) {
    return this.authService.checkAuthStatus( user );
}u  // ← Esta "u" rompe el código

// DESPUÉS:
@Get('check-status')
@Auth()
checkAuthStatus(
    @GetUser() user: User
) {
    return this.authService.checkAuthStatus( user );
}
```
**Verificar**: `npm run build` debe pasar sin errores en el backend.

---

### **Step B2: Instalar cookie-parser**

**Por qué**: Para que Nest pueda leer cookies del header `Cookie: token=...`

```bash
cd autenticacion
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

---

### **Step B2.5: Cambiar expiración a 15 minutos**

**Archivo**: autenticacion/src/auth/auth.module.ts

```typescript
// ANTES:
register: [
  JwtModule.register({
    secret: configService.get('JWT_SECRET'),
    signOptions: { expiresIn: '2h' }, // ← ERA 2 HORAS
  }),
],

// DESPUÉS:
register: [
  JwtModule.register({
    secret: configService.get('JWT_SECRET'),
    signOptions: { expiresIn: '15m' }, // ← CAMBIAR A 15 MIN
  }),
],
```

**Verificar**: `npm run build` sin errores.

---

### **Step B3: Habilitar cookie-parser en main.ts**

**Archivo**: autenticacion/src/main.ts

**Qué hacer**:
```typescript
// En el array de imports, agregar:
import cookieParser from 'cookie-parser';

// Después de setGlobalPrefix, agregar:
app.use(cookieParser());

// El código quedaría así:
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');
  app.use(cookieParser());  // ← NUEVA LÍNEA

  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // ← CAMBIAR origin: true
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // ... resto del código
}
```

**Por qué**: 
- `cookieParser()` prepara las cookies para ser leídas
- Cambiar `origin: true` a un valor específico es más seguro (CUIDADO: `origin: true` permite cualquier dominio)

**Verificar**: `npm run start:dev` debe iniciar sin errores.

---

### **Step B3.5: Agregar campo refreshToken en User entity**

**Archivo**: autenticacion/src/auth/entities/user.entity.ts

```typescript
// AGREGAR estas columnas:
@Column({ type: 'text', nullable: true })
refreshToken: string;

@Column({ type: 'timestamp', nullable: true })
refreshTokenExpiry: Date;
```

Luego migrar DB (o si usas SQLite en desarrollo, bastará reiniciar).

---



### **Step B4: Ajustar JwtStrategy para leer cookies**

**Archivo**: autenticacion/src/auth/strategies/jwt.strategy.ts

**Qué hay ahora**: Extrae JWT desde `Authorization: Bearer <token>`  
**Qué hacer**: Agregar extracción desde cookies además de Bearer

```typescript
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from "@nestjs/typeorm";
import { Strategy, ExtractJwt } from "passport-jwt";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        configService: ConfigService,
    ) {
        super({
            secretOrKey: configService.get<string>('JWT_SECRET'),
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),     // Opción 1: Bearer header
                (request: Request) => request.cookies.token,  // Opción 2: Cookie
            ]),
        });
    }

    async validate(payload: JwtPayload): Promise<User> {
        const { id } = payload;
        const user = await this.userRepository.findOneBy({ id });

        if (!user) 
            throw new Error('Token not valid');

        return user;
    }
}
```

**Por qué**: Así el backend acepta JWT tanto desde cookie como desde header (compatible con ambos clientes).

---

### **Step B4.5: Crear endpoint /api/auth/refresh**

**Archivo**: autenticacion/src/auth/auth.controller.ts

**Agregar método**:

```typescript
@Post('refresh')
async refresh(
    @Req() request: Request,
    @Res() response: Response
) {
    try {
        const refreshToken = request.cookies.refreshToken;

        if (!refreshToken) {
            throw new Error('No refresh token');
        }

        const result = await this.authService.refreshToken(refreshToken);

        // Setear cookies (access token + refresh token)
        response.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.STAGE === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutos
            path: '/',
        });

        if (result.refreshToken) {
            response.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
                path: '/',
            });
        }

        return response.json({
            user: result.user,
            token: result.token,
        });

    } catch (error: any) {
        return response.status(401).json({
            message: 'Refresh token inválido o expirado'
        });
    }
}
```

---


### **Step B5: Backend setea cookies en login/register**

**Archivo**: autenticacion/src/auth/auth.service.ts

**Qué hacer**: Modificar `login()` y `create()` para devolver el token + luego setear cookie desde el controller

```typescript
// En auth.service.ts, los métodos login() y create() YA devuelven {user, token}
// Eso está bien. El controller es quien setea la cookie.
```

**Archivo**: autenticacion/src/auth/auth.controller.ts

**Qué hacer**: Ajustar login/register para setear cookie en la respuesta

```typescript
import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { CreateUserDto, LoginUserDto } from "./dto";
import { GetUser } from "./decorators/get-user.decorator";
import { Auth } from "./decorators/auth.decorator";
import { User } from "./entities/user.entity";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async createUser(
        @Body() createUserDto: CreateUserDto,
        @Res() response: Response
    ) {
        const result = await this.authService.create(createUserDto);
        
        // SETEAR COOKIE
        response.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 2 * 60 * 60 * 1000, // 2 horas en milisegundos
            path: '/',
        });

        return response.json({
            user: result.user,
            token: result.token,
        });
    }

    @Post('login')
    async loginUser(
        @Body() loginUserDto: LoginUserDto,
        @Res() response: Response
    ) {
        const result = await this.authService.login(loginUserDto);
        
        // SETEAR COOKIE
        response.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 2 * 60 * 60 * 1000, // 2 horas en milisegundos
            path: '/',
        });

        return response.json({
            user: result.user,
            token: result.token,
        });
    }

    @Get('check-status')
    @Auth()
    async checkAuthStatus(
        @GetUser() user: User,
        @Res() response: Response
    ) {
        // Este endpoint también debe setear una NUEVA cookie (para renovar exp)
        const result = await this.authService.checkAuthStatus(user);

        response.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 2 * 60 * 60 * 1000,
            path: '/',
        });

        return response.json({
            user: result.user,
            token: result.token,
        });
    }

    // ... resto de endpoints
}
```

**Por qué**:
- Backend controla cuándo + cómo se setea la cookie (seguridad)
- Cookie tiene exp 2h, igual que el JWT
- `httpOnly: true` → JavaScript no puede acceder (seguro contra XSS)
- `secure: true` en producción → solo HTTPS
- `sameSite: 'lax'` → protección CSRF

**Verificar**:
```bash
npm run start:dev
# En otro terminal, hacer POST a /api/auth/login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test1234!"}' \
  -c cookies.txt

# Verificar que cookies.txt contiene el token
cat cookies.txt
```

---


### **Step B5.5: Implementar refreshToken() en auth.service.ts**

**Archivo**: autenticacion/src/auth/auth.service.ts

**Agregar método**:

```typescript
async refreshToken(refreshToken: string) {
    try {
        // Validar refresh token
        const payload = this.jwtService.verify(refreshToken, {
            secret: process.env.JWT_SECRET,
        });

        const user = await this.userRepository.findOneBy({ id: payload.id });

        if (!user || user.refreshToken !== refreshToken) {
            throw new Error('Refresh token no válido');
        }

        if (new Date() > user.refreshTokenExpiry) {
            throw new Error('Refresh token expirado');
        }

        // Generar nuevo access token + refresh token
        const newAccessToken = this.jwtService.sign({
            id: user.id,
            role: user.roles,
        });

        const newRefreshToken = this.jwtService.sign(
            { id: user.id },
            { expiresIn: '7d' } // Refresh token válido 7 días
        );

        // Guardar nuevo refresh token en BD
        user.refreshToken = newRefreshToken;
        user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.userRepository.save(user);

        return {
            user: { id: user.id, email: user.email, fullName: user.fullName, roles: user.roles },
            token: newAccessToken,
            refreshToken: newRefreshToken,
        };
    } catch (error) {
        throw new UnauthorizedException('Refresh token inválido');
    }
}
```

---


### **Step B6: Endurecimiento (ópcionalmente)**

**Cambiar CORS a origen específico** en autenticacion/src/main.ts:

```typescript
app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // ← Especificar
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
});
```

Agregar en .env:
```
CLIENT_URL=http://localhost:3000
```

---


### **Step B6.5: Setear refreshToken en login/register**

**Archivo**: autenticacion/src/auth/auth.controller.ts

**Modificar login() y register()**:

```typescript
@Post('register')
async createUser(
    @Body() createUserDto: CreateUserDto,
    @Res() response: Response
) {
    const result = await this.authService.create(createUserDto);
    
    // Crear refresh token (válido 7 días)
    const refreshToken = this.jwtService.sign(
        { id: result.user.id },
        { expiresIn: '7d' }
    );

    // Guardar en BD
    result.user.refreshToken = refreshToken;
    result.user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.userRepository.save(result.user);

    // Setear cookies
    response.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutos (no 2 horas)
        path: '/',
    });

    response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        path: '/',
    });

    return response.json({
        user: result.user,
        token: result.token,
    });
}

// Idem para login()
```

---



