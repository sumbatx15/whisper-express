import { NextFunction, Request, Response } from "express";
import { sessionCache } from "../../app";
import { calcWhisperTokens } from "../../config/tokens_system";
import {
  createAnonymousUser,
  createNewUser,
  getUser,
  getUserByUUID,
} from "../../db/user";
import { getGoogleTokenInfo } from "../../service/service";
import { Errors } from "../../shared/consts";
import { TranscribeRequest, transcriptionBodySchema } from "../../shared/types";
import { normalArrayToBlob } from "../../utils/audio";
import { bearer } from "../../utils/request";
import { getCachedSessionUser } from "../../utils/session";

export const identifyAndCacheAnonymous = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const fingerprint = bearer(req);
  if (sessionCache.get(fingerprint)) return next();

  try {
    const user =
      (await getUserByUUID(fingerprint)) ||
      (await createAnonymousUser(fingerprint));

    sessionCache.set(fingerprint, user.toObject());
    next();
  } catch (error) {
    res.status(401).send({
      errorCode: Errors.NoAccessToken,
      message: (error as Error).message,
    });
  }
};

export const identifyAndCacheUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const access_token = bearer(req);
  if (access_token.length <= 32) {
    return res.status(401).send({
      errorCode: Errors.NoAccessToken,
      message: "Invalid access token",
    });
  }

  if (sessionCache.get(access_token)) return next();

  try {
    const tokenInfo = await getGoogleTokenInfo(access_token);
    const user =
      (await getUser(tokenInfo.sub)) || (await createNewUser(tokenInfo));

    sessionCache.set(access_token, user.toObject());
    next();
  } catch (error) {
    res.status(401).send({
      errorCode: Errors.NoAccessToken,
      message: (error as Error).message,
    });
  }
};

export const hasBearer = (req: Request, res: Response, next: NextFunction) => {
  try {
    bearer(req);
    next();
  } catch (error) {
    res.status(401).send({
      errorCode: Errors.NoAccessToken,
      message: (error as Error).message + " - No access token",
    });
  }
};

export const hasValidBody = async (
  req: TranscribeRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    transcriptionBodySchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).send({
      message: "Invalid body",
      error,
    });
  }
};

export const hasEnoughTokens = async (
  req: TranscribeRequest,
  res: Response,
  next: NextFunction
) => {
  const cachedUser = getCachedSessionUser(req);
  const blob = await normalArrayToBlob(req.body.buffer);
  const tokens = calcWhisperTokens(blob);

  if ((cachedUser?.tokens || 0) > tokens) {
    next();
  } else {
    res.status(402).send({
      errorCode: Errors.NotEnoughTokens,
      message: "Not enough tokens",
    });
  }
};
