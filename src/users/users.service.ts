import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

import { SignupInput } from './../auth/dto/inputs/signup.input';
import { ValidRoles } from '../auth/enums/valid-roles.enum';

import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
  private logger: Logger = new Logger('UsersService');
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}
  async create(signupInput: SignupInput): Promise<User> {
    try {
      const newUser = this.usersRepository.create({
        ...signupInput,
        password: bcrypt.hashSync(signupInput.password, 10),
      });
      return await this.usersRepository.save(newUser);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async findAll(roles: ValidRoles[]): Promise<User[]> {
    const users = await this.usersRepository.find();
    if (roles.length === 0) return users;
    const filteredUsers = users.filter((user) =>
      roles.some((role) => user.roles.includes(role)),
    );

    return filteredUsers;
    /*Para usar la consulta y realizar el filtro directamente en la base de datos
    sin embargo solo funciona cuando se manda un role
     return this.usersRepository
       .createQueryBuilder()
       .andWhere('FIND_IN_SET(:roles, roles)', { roles: roles.join(',') })
       .getMany();*/
  }

  async findOneByEmail(email: string): Promise<User> {
    try {
      return await this.usersRepository.findOneByOrFail({ email });
    } catch (error) {
      throw new NotFoundException(`${email} not found`);
      // this.handleDBErrors({
      //   code: 'error-001',
      //   message: `${email} not found`,
      // });
    }
  }

  async findOneById(id: string): Promise<User> {
    try {
      return await this.usersRepository.findOneByOrFail({ id });
    } catch (error) {
      throw new NotFoundException(`${id} not found`);
    }
  }

  async update(
    id: string,
    updateUserInput: UpdateUserInput,
    updateBy: User,
  ): Promise<User> {
    try {
      const user = await this.usersRepository.preload({
        ...updateUserInput,
        id,
      });

      user.lastUpdateBy = updateBy;

      return this.usersRepository.save(user);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async block(id: string, adminUser: User): Promise<User> {
    const userToBlock = await this.findOneById(id);
    userToBlock.isActive = false;
    userToBlock.lastUpdateBy = adminUser;
    return await this.usersRepository.save(userToBlock);
  }

  private handleDBErrors(error: any): never {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new BadRequestException(error.message);
    }

    if (error.code === 'error-001') {
      throw new BadRequestException(error.message);
    }
    this.logger.error(error);
    throw new InternalServerErrorException('please check server logs');
  }
}
