import { Request } from "express";
import { sessionCache } from "../app";
import { bearer } from "./request";
import { IUser } from "../db/user";

export const getCachedSessionUser = (req: Request) => {
  return sessionCache.get<IUser>(bearer(req));
};

export const setCachedSessionUser = (req: Request, user: IUser) => {
  sessionCache.set(bearer(req), user);
};
