/* eslint-disable import/no-cycle */
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

import { getUser } from "./user";
import { getGoogleUserInfo } from "../service/service";

const isConnected = false;
export const connectToDataBase = async () => {
  if (isConnected) return;

  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
  } catch (err) {
    console.log(err);
  }
};

export interface IFeedback {
  google_account_id: string;
  rating: number;
  message: string;
}

type IAuth = {
  access_token: string;
  ott: string;
  expires_at: number;
};

const authSchema = new mongoose.Schema<IAuth>({
  access_token: String,
  ott: String,
  expires_at: Number,
});

const Auth = (mongoose.models.Auth ||
  mongoose.model<IAuth>("Auth", authSchema)) as mongoose.Model<IAuth>;

const feedbackSchema = new mongoose.Schema<IFeedback>({
  google_account_id: String,
  rating: Number,
  message: String,
});

const Feedback = (mongoose.models.Feedback ||
  mongoose.model<IFeedback>(
    "Feedback",
    feedbackSchema
  )) as mongoose.Model<IFeedback>;

const createOTT = () => {
  // const tenMinutes = 1000 * 60 * 10;
  return {
    token: uuidv4(),
    expires_at: Infinity,
  };
};

export const getOTT = async (access_token: string) => {
  await connectToDataBase();
  const ott = createOTT();
  await Auth.updateOne(
    { access_token },
    {
      $set: {
        ott: ott.token,
        expires_at: ott.expires_at,
      },
    },
    { upsert: true }
  );

  const auth = await Auth.findOne({ access_token });
  console.log("auth:", auth);

  return ott;
};

export const validateOTT = async (token: string) => {
  await connectToDataBase();
  const auth = await Auth.findOne({ ott: token });
  return {
    isValid: !!auth && auth.expires_at > Date.now(),
    auth,
  };
};

export const getAccountInfoByOTT = async (token: string) => {
  const { isValid, auth } = await validateOTT(token);
  if (!isValid || !auth) throw new Error("Invalid token");

  const googleUserInfo = await getGoogleUserInfo(auth.access_token);
  return {
    googleUserInfo,
    user: await getUser(googleUserInfo.sub),
  };
};

export const addFeedback = async (
  google_account_id: string,
  feedback: Omit<IFeedback, "google_account_id">
) => {
  await connectToDataBase();
  return Feedback.create({
    google_account_id,
    ...feedback,
  });
};
