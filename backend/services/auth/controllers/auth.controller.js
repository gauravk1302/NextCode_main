import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import {getAuth} from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import redis from "../../../shared/redis/redis.js";
import crypto from "crypto";

export const login = async (req, res) => {
  try {
    // Verify the token and user find
    const { token } = req.body;
    const decoded = await getAuth(app).verifyIdToken(token);
    let user = await User.findOne({
      firebaseUid: decoded.uid,
    });

    // Check for user if exists or not
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture,
      });
    }

    // User set on redis
    const sessionId = crypto.randomUUID();
    await redis.set(
      `user-session-${user?._id}`,
      sessionId,
      "EX",
      7 * 24 * 60 * 60,
    );
    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        userId: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        credits: user.credits,
      }),
      "EX",
      7 * 24 * 60 * 60,
    );

    // Send data with cookie
    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `Login error ${error}` });
  }
};

export const logout = async (req, res) => {
  try {

    // Get the sessionId and delete from the redis
    const sessionId = req.cookies?.session;
    await redis.del(`session-${sessionId}`);

    // Clear the cookie
    res.clearCookie("session");
    return res.status(200).json({ message: "logout successfully" });
  } catch (error) {
    return res.status(500).json({ message: `Logout error ${error}` });
  }
};

// Add Credit and Deduct Credit AI Generated logic
export const deductCredits = async (req, res) => {
  try {
    const userId = req.body.userId;

    const amount = Number(req.body.amount);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid credit amount",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        credits: {
          $gte: amount,
        },
      },
      {
        $inc: {
          credits: -amount,
        },
      },
      {
        returnDocument: "after",
      },
    ).select("credits name email avatar");

    if (!user) {
      return res.status(402).json({
        success: false,
        message: "Insufficient credits",
      });
    }

    const sessionId = await redis.get(`user-session-${userId}`);
    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        userId: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        credits: user.credits,
      }),
      "EX",
      7 * 24 * 60 * 60,
    );

    return res.status(200).json({
      success: true,
      credits: user.credits,
      deducted: amount,
    });
  } catch (error) {
    console.error("Deduct credits error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addCredits = async (req, res) => {
  try {
    const { userId, plan, credits } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.credits = (user.credits || 0) + credits;

    user.plan = plan;

    await user.save();

    const sessionId = await redis.get(`user-session-${userId}`);
    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        userId: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        credits: user.credits,
      }),
      "EX",
      7 * 24 * 60 * 60,
    );
    return res.json({
      success: true,

      credits: user.credits,

      plan: user.plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
