import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      name?: string;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
  }
}
