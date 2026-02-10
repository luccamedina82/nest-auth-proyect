import { CookieOptions } from 'express';

const baseCookieConfig: CookieOptions = {
    httpOnly: true,
    secure: process.env.STAGE === 'production',
    sameSite: 'lax',
    path: '/',
};

export const ACCESS_TOKEN_COOKIE_CONFIG: CookieOptions = {
    ...baseCookieConfig,
    maxAge: 15 * 60 * 1000, 
};

export const REFRESH_TOKEN_COOKIE_CONFIG: CookieOptions = {
    ...baseCookieConfig,
    maxAge: 7 * 24 * 60 * 60 * 1000, 
};

export const COOKIE_NAMES = {
    ACCESS_TOKEN: 'token',
    REFRESH_TOKEN: 'refreshToken',
} as const;
