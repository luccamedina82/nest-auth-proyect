import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';


@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { 
        unique: true
     })
     email: string;

    @Column('text', {
        select: false
    })
    password: string;

    @Column('text')
    fullName: string;

    @Column({ type: 'text', nullable: true })
    refreshToken: string | null;

    @Column({ type: 'timestamp', nullable: true })
    refreshTokenExpiry: Date | null;
    
    @Column('text', {
        array: true,
        default: ['user']
    })



    roles: string[];
}