import { ObjectType, Field, ID } from '@nestjs/graphql';

import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './../../users/entities/user.entity';
import { ListItem } from './../../list-item/entities/list-item.entity';

@ObjectType()
@Entity({ name: 'lists' })
export class List {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column('varchar')
  @Field(() => String)
  name: string;

  @ManyToOne(() => User, (user) => user.lists, { lazy: true, nullable: false })
  @Index('userId-list-index')
  @Field(() => User)
  user: User;

  @OneToMany(() => ListItem, (listItem) => listItem.list, { lazy: true })
  // @Field(() => [ListItem])
  listItem: ListItem[];
}
