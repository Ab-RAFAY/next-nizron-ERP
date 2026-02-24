import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class ClientLoginDto {
  @ApiProperty({ description: 'Client Email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Client password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
