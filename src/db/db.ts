import mongoose from "mongoose";

export default async function connectDB() {
  mongoose.set("strictQuery", true);

  mongoose.connection.once("open", () => {
    console.log(`Database connected`);
  });

  mongoose.connection.on("error", (err) => {
    console.error(`connection error: ${err}`);
  });

  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  return;
}
