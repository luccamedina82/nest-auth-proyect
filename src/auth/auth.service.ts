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

            return{
                user: userData,
                token: this.getJwtToken({ id: user.id })

            }
        } catch (error) {
            console.log(error);
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

        return {
            user: userData,
            token: this.getJwtToken({ id: user.id })
        };
    }

    async checkAuthStatus( user: User ){
        return {
            user: user,
            token: this.getJwtToken({ id: user.id })
        }
    }


    private getJwtToken( payload: JwtPayload ){
        const token = this.jwtService.sign( payload );
        return token;
    }
}