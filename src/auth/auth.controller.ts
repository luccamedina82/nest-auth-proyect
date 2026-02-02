import { Body, Controller, Get, Headers, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { CreateUserDto, LoginUserDto } from "./dto";
import { GetUser } from "./decorators/get-user.decorator";
import { Auth } from "./decorators/auth.decorator";
import { User } from "./entities/user.entity";
import { AuthGuard } from "@nestjs/passport";
import { RawHeaders, RoleProtected } from "./decorators";
import type { IncomingHttpHeaders } from "http";
import { UserRoleGuard } from "./guards/user-role.guard";
import { ValidRoles } from "./interfaces";


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) {}

    @Post('register')
    createUser(@Body() createUserDto: CreateUserDto) {
        return this.authService.create( createUserDto );
    }

    @Post('login')
    loginUser(@Body() loginUserDto: LoginUserDto) {
        return this.authService.login( loginUserDto );
    }

    @Get('check-status')
    @Auth()
    checkAuthStatus(
        @GetUser() user: User
    ) {
        return this.authService.checkAuthStatus( user );
    }



    @Get('private')
    @UseGuards(AuthGuard())
    testingPrivateRoute(
        @Req() request: Express.Request,
        @GetUser() user: User,
        @GetUser('email') userEmail: string,
        
        @RawHeaders() rawHeaders: string[],
        @Headers() headers: IncomingHttpHeaders,
    ) {
        return {
            ok: true,
            message: 'Hola Mundo Private',
            user,
            userEmail,
            rawHeaders,
            headers,
        }
    }


    @Get('private2')
    @RoleProtected( ValidRoles.superUser, ValidRoles.admin )
    @UseGuards( AuthGuard(), UserRoleGuard )
    privateRoute2(
        @GetUser() user: User
    ) {

        return {
        ok: true,
        user
        }
    }
}
