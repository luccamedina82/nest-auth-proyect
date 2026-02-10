import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import {
    ACCESS_TOKEN_COOKIE_CONFIG,
    REFRESH_TOKEN_COOKIE_CONFIG,
    COOKIE_NAMES,
} from '../constants/cookie.constants';


@Injectable()
export class CookieInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const response = context.switchToHttp().getResponse<Response>();

        return next.handle().pipe(
            map((data) => {
                if (data?.token !== undefined) {
                    if (data.token === null) {
                        response.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, {
                            httpOnly: true,
                            secure: process.env.STAGE === 'production',
                            sameSite: 'lax',
                            path: '/',
                        });
                    } else {
                        response.cookie(
                            COOKIE_NAMES.ACCESS_TOKEN,
                            data.token,
                            ACCESS_TOKEN_COOKIE_CONFIG
                        );
                    }
                }

                if (data?.refreshToken !== undefined) {
                    if (data.refreshToken === null) {
                        response.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
                            httpOnly: true,
                            secure: process.env.STAGE === 'production',
                            sameSite: 'lax',
                            path: '/',
                        });
                    } else {
                        response.cookie(
                            COOKIE_NAMES.REFRESH_TOKEN,
                            data.refreshToken,
                            REFRESH_TOKEN_COOKIE_CONFIG
                        );
                    }
                    
                    // Eliminar refreshToken del body por seguridad
                    // Solo debe estar en la cookie httpOnly, no en la respuesta JSON
                    delete data.refreshToken;
                }

                return data;
            })
        );
    }
}
