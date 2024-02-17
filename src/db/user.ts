import type { StringExpression } from "mongoose";
import mongoose from "mongoose";
import { FREE_TOKENS, NEW_USER_TOKENS } from "../config/tokens_system";
import { GoogleTokenInfo } from "../shared/types";
import { addDefaultModesToUser } from "./modes";
import { Usage } from "./usage";

export interface IUser {
  uuid?: string;
  google_account_id: string;
  email?: string;
  tokens: number;
  plan_tokens: number;
}

const userSchema = new mongoose.Schema<IUser>({
  uuid: String,
  google_account_id: String,
  email: String,
  tokens: Number,
  plan_tokens: Number,
});

export const User = (mongoose.models.User ||
  mongoose.model<IUser>("User", userSchema)) as mongoose.Model<IUser>;

export const createAnonymousUser = async (uuid: StringExpression) => {
  return User.create({
    uuid,
    tokens: FREE_TOKENS.tokens,
    plan_tokens: FREE_TOKENS.plan_tokens,
  });
};

export const createNewUser = async (tokenInfo: GoogleTokenInfo) => {
  addDefaultModesToUser(tokenInfo.sub);
  return User.create({
    google_account_id: tokenInfo.sub,
    email: tokenInfo.email,
    tokens: NEW_USER_TOKENS.tokens,
    plan_tokens: NEW_USER_TOKENS.plan_tokens,
  });
};

export const addTokens = async (
  google_account_id: string,
  tokens: number,
  plan_tokens?: number
) => {
  return User.updateOne(
    { google_account_id },
    {
      $inc: {
        tokens,
      },
      $set: {
        plan_tokens,
      },
    },
    { upsert: true }
  );
};

export const decreaseTokens = async (
  google_account_id: string,
  tokens: number
) => {
  return User.updateOne(
    { google_account_id },
    {
      $inc: {
        tokens: -tokens,
      },
    },
    { upsert: true }
  );
};

export const decreaseTokensByUUID = async (uuid: string, tokens: number) => {
  return User.updateOne(
    { uuid },
    {
      $inc: {
        tokens: -tokens,
      },
    },
    { upsert: true }
  );
};

export const getUser = async (google_account_id: string, email?: string) => {
  console.log("fetching user from db");
  const user = await User.findOne({ google_account_id });
  if (!user) return user;

  if (!user.email && email) {
    user.email = email;
    await user.save();
  }
  return user;
};

export const getUserByUUID = async (uuid: string) => {
  return User.findOne({ uuid });
};

export const fingUserByUUIDOrGoogleID = async (
  uuid: string,
  google_account_id: string
) => {
  return User.findOne({ $or: [{ uuid }, { google_account_id }] });
};

export const mergeUsage = (uuid: string, google_account_id: string) => {
  return Usage.updateOne(
    { uuid },
    {
      $set: {
        google_account_id,
      },
    }
  );
};

export const convertAnonymousToGoogleUser = async (
  uuid: string,
  google_account_id: string,
  email: string
) => {
  Usage.updateOne(
    {
      uuid,
    },
    {
      $set: {
        google_account_id,
      },
    }
  );

  const user = await getUserByUUID(uuid);
  if (!user) return user;

  user.google_account_id = google_account_id;
  user.tokens = NEW_USER_TOKENS.tokens;
  user.plan_tokens = NEW_USER_TOKENS.plan_tokens;
  user.email = email;
  await user.save();
  return user;
};
