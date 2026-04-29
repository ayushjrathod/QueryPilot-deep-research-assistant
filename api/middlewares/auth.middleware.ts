import type { Request, Response, NextFunction } from "express";
import { verify, sign } from "jsonwebtoken";

export interface CustomRequest extends Request {
  user?: any;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-env";

export const authenticateToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"] as string | undefined;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Access token is missing",
    });
    return;
  }

  try {
    const decoded = verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const generateAccessToken = (userId: string, email: string): string => {
  return sign({ userId, email }, JWT_SECRET, { expiresIn: "1h" });
};

export const generateRefreshToken = (userId: string): string => {
  return sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

export default authenticateToken;
