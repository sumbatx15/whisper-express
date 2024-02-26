import { NextFunction, Request, Response } from "express";
import { calcWhisperTokens } from "../../config/tokens_system";
import { createAnonymousUser, getUser, getUserByUUID } from "../../db/user";
import { getGoogleTokenInfo } from "../../service/service";
import { Errors } from "../../shared/consts";
import { TranscribeRequest, transcriptionBodySchema } from "../../shared/types";
import { normalArrayToBlob } from "../../utils/audio";
import { bearer } from "../../utils/request";
import {
  getCachedSessionUser,
  setCachedSessionUser,
} from "../../utils/session";

export const validGoogleToken = async (
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

  try {
    req.context.tokenInfo = await getGoogleTokenInfo(access_token);
    next();
  } catch (error) {
    res.status(401).send({
      errorCode: Errors.NoAccessToken,
      message: (error as Error).message,
    });
  }
};

export const validFingerprint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const auth = bearer(req);
  if (auth.length < 64) {
    return res.status(401).send({
      errorCode: Errors.NoAccessToken,
      message: "Invalid access token",
    });
  }

  const [fingerprint, encoded] = [auth.slice(0, 32), auth.slice(32)];
  const decoded = [
    encoded.slice(0, 10).split(""),
    encoded.slice(10, 21).split(""),
    encoded.slice(21).split(""),
  ]
    .map((chunk) =>
      chunk.map((char) => String.fromCharCode(char.charCodeAt(0) - 1))
    )
    .reverse()
    .flat()
    .join("");

  if (fingerprint !== decoded) {
    return res.status(401).send({
      errorCode: Errors.NoAccessToken,
      message: "Invalid access token",
    });
  }

  req.context.fingerprint = fingerprint;
  next();
};

export const identifyAndCacheAnonymous = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const fingerprint = req.context.fingerprint!;

  if (getCachedSessionUser(req)) {
    return next();
  }

  try {
    const user =
      (await getUserByUUID(fingerprint)) ||
      (await createAnonymousUser(fingerprint));

    setCachedSessionUser(req, user.toObject());
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

  if (getCachedSessionUser(req)) return next();

  try {
    const tokenInfo = await getGoogleTokenInfo(access_token);
    const user = await getUser(tokenInfo.sub);
    if (!user) {
      return res.status(401).send({
        errorCode: Errors.UserNotFound,
        message: "User not found",
      });
    }

    setCachedSessionUser(req, user.toObject());
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

export const validTranscriptionBody = async (
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
    req.context.blob = blob;
    next();
  } else {
    res.status(402).send({
      errorCode: Errors.NotEnoughTokens,
      message: "Not enough tokens",
    });
  }
};
