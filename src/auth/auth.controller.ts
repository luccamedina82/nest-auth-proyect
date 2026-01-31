import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { CreateUserDto, LoginUserDto } from "./dto";


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

    // @Get('check-status')
    // // @Auth()
    // checkAuthStatus(
    //     @Get
    // ) {
}
