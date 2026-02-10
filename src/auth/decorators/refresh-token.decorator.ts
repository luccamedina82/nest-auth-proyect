import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { COOKIE_NAMES } from '../constants/cookie.constants';

export const RefreshToken = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        const refreshToken = request.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        return refreshToken;
    },
);
