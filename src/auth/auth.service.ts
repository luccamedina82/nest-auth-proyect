import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { CreateUserDto, LoginUserDto } from "./dto";
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "./interfaces/jwt-payload.interface";




@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,

    ) {}

    async create( createUserDto: CreateUserDto){
        try {
            const {password, ...userData} = createUserDto;

            const user = this.userRepository.create({
                ...userData,
                password: bcrypt.hashSync(password, 10),
            });

            await this.userRepository.save(user);

            const refreshToken = this.jwtService.sign(
                { id: user.id },
                { expiresIn: '7d' }
            );

            user.refreshToken = refreshToken;
            user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await this.userRepository.save(user);

            return{
                user: userData,
                token: this.getJwtToken({ 
                    id: user.id,
                    role: user.roles
                }),
                refreshToken
            }
        } catch (error) {
            throw new UnauthorizedException('Failed to create user');
        }
    }

    async login( loginUserDto: LoginUserDto){
        const { password, email } = loginUserDto;

        const user = await this.userRepository.findOne({ 
            where: { email },
            select: { password: true, email: true, id: true, fullName: true, roles: true }
            });

        if(!user) 
            throw new UnauthorizedException('Credentials are not valid (email)');
        
        if( !bcrypt.compareSync( password, user.password))
            throw new UnauthorizedException('Credentials are not valid (password)');
    
        const { password: _, ...userData } = user;

        const refreshToken = this.jwtService.sign(
            { id: user.id },
            { expiresIn: '7d' }
        );

        user.refreshToken = refreshToken;
        user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.userRepository.save(user);

        return {
            user: userData,
            token: this.getJwtToken({ 
                id: user.id,
                role: user.roles
            }),
            refreshToken
        };
    }

    async checkAuthStatus( user: User ){
        return {
            user: user,
            token: this.getJwtToken({ 
                id: user.id,
                role: user.roles
            })
        }
    }

    private getJwtToken( payload: JwtPayload ){
        const token = this.jwtService.sign( payload );
        return token;
    }


    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            
            const user = await this.userRepository.findOneBy({ id: payload.id });

            if (!user || user.refreshToken !== refreshToken) {
                throw new UnauthorizedException('Refresh token invalid');
            }

            if (!user.refreshTokenExpiry || new Date() > user.refreshTokenExpiry) {
                throw new UnauthorizedException('Refresh token expired');
            }

            const newAccessToken = this.getJwtToken({
                id: user.id,
                role: user.roles,
            });

            const newRefreshToken = this.jwtService.sign(
                { id: user.id },
                { expiresIn: '7d' }
            );

            user.refreshToken = newRefreshToken;
            user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await this.userRepository.save(user);

            return {
                user: { id: user.id, email: user.email, fullName: user.fullName, roles: user.roles },
                token: newAccessToken,
                refreshToken: newRefreshToken,
            };
        } catch (error) {
            throw new UnauthorizedException('Refresh token invalid or expired');
        }
    }

    async logout(refreshToken: string) {
        try {
            const decoded = await this.jwtService.verifyAsync(refreshToken);
            const user = await this.userRepository.findOne({
                where: { id: decoded.id }
            });

            if (user) {
                user.refreshToken = null;
                user.refreshTokenExpiry = null;
                await this.userRepository.save(user);
            }

            return { success: true, message: 'Logout successful' };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
}


}