/** @format */

import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { User } from "./entity/User";
import { MyContext } from "./MyContext";

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
}

@Resolver(() => Boolean)
export class UserResolver {
  @Query(() => String)
  hello() {
    return "hi!";
  }
  @Query(() => [User])
  users() {
    return User.find();
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error("Invalid Login");
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      throw new Error("Bad Password");
    }
    // login successful
    res.cookie(
      "jid",
      sign({ userId: user.id }, "qiueqieurqwe", {
        expiresIn: "7d",
      }),
      {
        httpOnly: true,
      }
    );
    return {
      accessToken: sign({ userId: user.id }, "asdfasdf", { expiresIn: "15m" }),
    };
  }

  @Mutation(() => Boolean)
  async register(
    @Arg("email") email: string,
    @Arg("password") password: string
  ) {
    const hashedPassword = await hash(password, 12);
    try {
      await User.insert({
        email,
        password: hashedPassword,
      });
    } catch (error) {
      console.log(error);
      return false;
    }
    return true;
  }
}