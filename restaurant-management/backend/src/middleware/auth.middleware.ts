import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, UserRole } from "../models/user.model";
import { AppError } from "./errorHandler";

interface JwtPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1) Get token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      console.log("Authentication Failed: No token provided");
      return next(
        new AppError("You are not logged in. Please log in to get access.", 401)
      );
    }

    // 2) Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    console.log("Token Verified:", { userId: decoded.id });

    // 3) Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("Authentication Failed: User not found", {
        userId: decoded.id,
      });
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    console.log("User Authenticated:", {
      userId: user._id,
      role: user.role,
      email: user.email,
    });

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication Error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    next(new AppError("Invalid token. Please log in again.", 401));
  }
};

export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log("Checking Role Access:", {
      userRole: req.user.role,
      requiredRoles: roles,
      hasAccess: roles.includes(req.user.role),
    });

    if (!roles.includes(req.user.role)) {
      console.log("Access Denied: Insufficient permissions", {
        userRole: req.user.role,
        requiredRoles: roles,
      });
      return next(
        new AppError(
          `You do not have permission to perform this action. Required roles: ${roles.join(
            ", "
          )}`,
          403
        )
      );
    }
    next();
  };
};
