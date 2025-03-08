import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { db } from "../db/connectFirestore";
import { failureResponse } from "../helpers/responseHelpers";
import { HTTP_STATUS_CODE } from "../helpers/constants";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, "Unauthorized");

    const decodedToken = await admin.auth().verifyIdToken(token);
    //@ts-ignore
    req.uid=decodedToken.uid;
    // Collection Reference
    const collectionRef = db.collection("contractor");
    // @ts-ignore
    const docRef = collectionRef.doc("/" + req.uid);
    const doc = await docRef.get();
    if (doc.exists) {
      next();
    } else {
      return failureResponse(res, 400, "SIGNED_IN_USER_NOT_CLIENT");
    }
    next();
  } catch (error) {
    return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, "Invalid Token");
  }
};
