import mongoose from "mongoose";
import { GPT_MODELS, defaultModes } from "../shared/consts";

export type IMode = {
  name: string;
  instructions: string;
  description?: string;
  hidden?: boolean;
  icon: {
    name: string;
    color: string;
    pack: "sax" | "feather";
  };
  model: (typeof GPT_MODELS)[number];
};

const modeSchema = new mongoose.Schema<IMode>({
  name: String,
  instructions: String,
  description: String,
  hidden: Boolean,
  icon: {
    name: String,
    color: String,
    pack: String,
  },
  model: String,
});

type IUserModes = {
  google_account_id: string;
  modes: IMode[];
};

const userModesSchema = new mongoose.Schema<IUserModes>({
  google_account_id: String,
  modes: [modeSchema],
});

const UserModes = (mongoose.models.UserModes ||
  mongoose.model<IUserModes>(
    "UserModes",
    userModesSchema
  )) as mongoose.Model<IUserModes>;

export const addDefaultModesToUser = async (google_account_id: string) => {
  const user = await UserModes.findOne({ google_account_id });
  if (user?.modes) return null;

  return UserModes.create({
    google_account_id,
    modes: defaultModes,
  });
};

export const getModes = async (google_account_id: string) => {
  const user = await UserModes.findOne({ google_account_id });
  if (!user) {
    throw new Error("User not found");
  }
  return user?.modes;
};

export const addMode = async (google_account_id: string, mode: IMode) => {
  const user = await UserModes.findOne({ google_account_id });
  if (!user) {
    throw new Error("User not found");
  }
  user.modes.push(mode);
  await user.save();
  return user.modes;
};

export const updateMode = async (
  google_account_id: string,
  id: string,
  mode: Partial<IMode>
) => {
  const user = await UserModes.findOne({ google_account_id });
  if (!user) {
    throw new Error("User not found");
  }

  // @ts-expect-error _id is not typed
  const index = user.modes.findIndex((m) => m._id.toString() === id);
  if (index === -1) {
    throw new Error("Mode not found");
  }

  console.log("mode:", mode);
  user.modes[index] = { ...user.modes[index], ...mode };
  await user.save();
  return user.modes;
};

export const deleteMode = async (google_account_id: string, id: string) => {
  return UserModes.findOneAndUpdate(
    { google_account_id },
    { $pull: { modes: { _id: id } } },
    { safe: true, multi: false }
  ).then(() => getModes(google_account_id));
};
