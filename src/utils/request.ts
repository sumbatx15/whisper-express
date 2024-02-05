import { Request } from "express";

export const bearer = (req: Request) => {
  const auth = req.headers.authorization;
  if (!auth) throw new Error("No authorization header");
  // Splitting the header on space
  const parts = auth.split(" ");

  // Check if the header is properly formed
  if (parts.length === 2 && parts[0] === "Bearer" && parts[1]) {
    return parts[1];
  }
  throw new Error("Invalid token format");
};

export const tryCatch = async <T>(fn: () => Promise<T> | T) => {
  try {
    return await fn();
  } catch (e) {
    return undefined;
  }
};
