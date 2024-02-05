import { Request } from "express";
import { sessionCache } from "../app";
import { bearer } from "./request";
import { IUser } from "../db/user";

export const getCachedSessionUser = (req: Request) => {
  const fingerprint = bearer(req);
  return sessionCache.get<IUser>(fingerprint);
};
