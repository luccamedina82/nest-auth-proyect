import { Body, Controller, Get, Post, UseInterceptors } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { CreateUserDto, LoginUserDto } from "./dto";
import { GetUser, RefreshToken } from "./decorators";
import { Auth } from "./decorators/auth.decorator";
import { User } from "./entities/user.entity";
import { CookieInterceptor } from "./interceptors/cookie.interceptor";


@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(CookieInterceptor)
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    @Post('register')
    async createUser(@Body() createUserDto: CreateUserDto) {
        return this.authService.create(createUserDto);
    }

    @Post('login')
    async loginUser(@Body() loginUserDto: LoginUserDto) {
        return this.authService.login(loginUserDto);
    }

    @Get('check-status')
    @Auth()
    async checkAuthStatus(@GetUser() user: User) {
        return this.authService.checkAuthStatus(user);
    }

    @Post('refresh')
    async refresh(@RefreshToken() refreshToken: string) {
        return this.authService.refreshToken(refreshToken);
    }


    @Post('logout')
    async logout(@RefreshToken() refreshToken: string) {
        await this.authService.logout(refreshToken);
        
        return {
            message: 'Logged out successfully',
            token: null,
            refreshToken: null,
        };
    }


    // @Get('private')
    // @UseGuards(AuthGuard())
    // testingPrivateRoute(
    //     @Req() request: Express.Request,
    //     @GetUser() user: User,
    //     @GetUser('email') userEmail: string,
        
    //     @RawHeaders() rawHeaders: string[],
    //     @Headers() headers: IncomingHttpHeaders,
    // ) {
    //     return {
    //         ok: true,
    //         message: 'Hola Mundo Private',
    //         user,
    //         userEmail,
    //         rawHeaders,
    //         headers,
    //     }
    // }

    // @Get('private2')
    // @RoleProtected( ValidRoles.superUser, ValidRoles.admin )
    // @UseGuards( AuthGuard(), UserRoleGuard )
    // privateRoute2(
    //     @GetUser() user: User
    // ) {

    //     return {
    //     ok: true,
    //     user
    //     }
    // }
}
