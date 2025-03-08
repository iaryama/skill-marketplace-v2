import { Request, Response } from "express";
import { getCurrentISTDateTime } from "../helpers/miscellaneous";
import { JWT_SECRET_KEY } from "../utils/constants";
import admin from "firebase-admin";
import { db } from "../utils/connectFirestore";
import jwt from "jsonwebtoken";
import { failureResponse } from "../helpers/responseHelpers";

export const authenticate = async (req: Request, res: Response, next: () => void) => {
  const path = req.originalUrl.split("/")[1];
  switch (path) {
    case "bmd-partner": {
      return authenticatePartner(req, res, next);
    }

    //If confirmation call thriugh website ignore auth
    default: {
      if (req.path === "confirm") {
        next();
      }
      return authenticateClientAgent(req, res, next);
    }
  }
};

/**
 * Middleware to authenticate Partner
 */
export const authenticatePartner = async (req: Request, res: Response, next: () => void) => {
  try {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0];
    const token = req.headers.token as string;
    if (!token) {
      return failureResponse(res, 401, "NO_BEARER_TOKEN");
    }
    if (!token.startsWith("Bearer ")) {
      return failureResponse(res, 401, "NOT_VALID_BEARER_TOKEN");
    }
    const userToken = token.split(" ")[1];
    const decodedToken = jwt.verify(userToken, JWT_SECRET_KEY);
    //@ts-ignore
    req.uid = decodedToken.uid;
    // Collection Reference
    const collectionRef = db.collection("partners");
    // @ts-ignore
    const docRef = collectionRef.doc("/" + req.uid);
    const doc = await docRef.get();
    if (doc.exists) {
      const { ips }: { ips?: string[] } = doc.data();
      if (!ips.includes(ip)) {
        return failureResponse(res, 400, "IP_NOT_WHITELISTED");
      }
      //@ts-ignore
      req.data = doc.data();

      next();
    } else {
      return failureResponse(res, 400, "SIGNED_IN_USER_NOT_PARTNER");
    }
  } catch (error) {
    console.error(getCurrentISTDateTime() + ":", error);
    //@ts-ignore
    if (error.code === "auth/id-token-expired") {
      return failureResponse(res, 401, "TOKEN_EXPIRED");
    }
    return failureResponse(res, 401, error.toString());
  }
};

/**
 * Authenticate Super-Admin
 */
export const authenticateSuperAdmin = async (req: Request, res: Response, next: () => void) => {
  try {
    const superAdminIdToken = req.headers.authorization as string;
    const decodedToken = await admin.auth().verifyIdToken(superAdminIdToken);
    const uid = decodedToken.uid;
    // Collection Reference
    const collectionRef = admin.firestore().collection("adminusers");
    const docRef = collectionRef.doc(uid);
    const doc = await docRef.get();
    if (doc.exists && doc.data().accessLevel === "Super-Admin") {
      next();
    } else {
      return failureResponse(res, 403, "ACCESS_DENIED");
    }
  } catch (error) {
    return failureResponse(res, 401, error.toString());
  }
};

export const authenticateClientAgent = async (req: Request, res: Response, next: () => void) => {
  try {
    const userToken = req.headers.authorization as string;
    const decodedToken = await admin.auth().verifyIdToken(userToken);
    //@ts-ignore
    req.uid = decodedToken.uid;
    // Collection Reference
    const collectionRef = db.collection("adminusers");
    // @ts-ignore
    const docRef = collectionRef.doc("/" + req.uid);
    const doc = await docRef.get();
    if (doc.exists) {
      if (doc.data().department !== "Booking-Agent") {
        return failureResponse(res, 400, "SIGNED_IN_ADMIN_USER_NOT_AGENT");
      } else {
        //@ts-ignore
        req.userType = "agent";
      }
    } else {
      //@ts-ignore
      req.userType = "client";
    }
    next();
  } catch (error) {
    console.error(getCurrentISTDateTime() + ":", error);
    return failureResponse(res, 401, error.toString());
  }
};
