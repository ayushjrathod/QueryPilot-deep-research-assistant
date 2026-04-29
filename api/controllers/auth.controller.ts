import type { Request, Response } from "express";
import { prisma } from "../db.ts/db";
import { PasswordUtils } from "../utils/password";
import { SignUpSchema, SignInSchema } from "../utils/validators";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../middlewares/auth.middleware.ts";
import type { CustomRequest } from "../middlewares/auth.middleware.ts";

export const signUpController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parsed = SignUpSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: { email: parsed.email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    const passwordHash = await PasswordUtils.hashPassword(parsed.password);

    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        name: parsed.name,
        passwordHash,
        provider: "EMAIL",
      },
    });

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("validation")) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Sign up failed",
      });
    }
  }
};

export const signInController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parsed = SignInSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { email: parsed.email },
    });

    const userAny = user as any;

    if (!userAny || !userAny.passwordHash) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const isPasswordValid = await PasswordUtils.comparePassword(
      parsed.password,
      userAny.passwordHash
    );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const accessToken = generateAccessToken(userAny.id, userAny.email);
    const refreshToken = generateRefreshToken(userAny.id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: userAny.id,
          email: userAny.email,
          name: userAny.name,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Sign in failed",
    });
  }
};

export const refreshTokenController = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user?.userId) {
      res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
      return;
    }

    const newAccessToken = generateAccessToken(user.userId, user.email);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Token refresh failed",
    });
  }
};

export const signOutController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Sign out failed",
    });
  }
};
