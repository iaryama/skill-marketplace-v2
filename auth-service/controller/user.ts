import express from "express";
import { validationResult, body } from "express-validator";
import { logPrefix } from "../helpers/logger";
import { JWT_SECRET_KEY } from "../configuration/config";
import admin from "firebase-admin";
import { db } from "../../db/connectFirestore";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { failureResponse, successResponse } from "../helpers/responseHelpers";
import { HTTP_STATUS_CODE, Log } from "../helpers/constants";

export const signUpValidation = [
  body("providerType").isIn(["individual", "company"]).notEmpty(),
  body("firstName").isString().notEmpty(),
  body("lastName").isString().notEmpty(),
  body("email").isEmail().notEmpty(),
  body("password")
    .isLength({ min: 8 })
    .matches(/[A-Z]/)
    .matches(/[a-z]/)
    .matches(/\d/)
    .matches(/[!@#$%^&*(),.?":{}|<>]/),
  body("companyName").if(body("providerType").equals("company")).isString().notEmpty(),
  body("businessTaxNumber")
    .if(body("providerType").equals("company"))
    .matches(/^[A-Z0-9]{10}$/),
  body("mobileNumber").isString().notEmpty(),
  body("streetNumber").isString().notEmpty(),
  body("streetName").isString().notEmpty(),
  body("city").isString().notEmpty(),
  body("state").isString().notEmpty(),
  body("postCode").isString().notEmpty(),
];

export async function signUp(req: express.Request, res: express.Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return failureResponse(res, 400, errors.array());
    }

    const { providerType, firstName, lastName, email, password, companyName, businessTaxNumber, mobileNumber, streetNumber, streetName, city, state, postCode } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      if (userRecord) {
        return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, "EMAIL_EXISTS");
      }
    } catch (error: any) {
      if (error.code && error.code !== "auth/user-not-found") {
        return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, error.code);
      }
    }

    const { uid } = await admin.auth().createUser({ email, password, displayName: providerType === "individual" ? `${firstName} ${lastName}` : companyName });
    const userType = req.originalUrl.split("/")[1] as "client" | "contractor";
    const collectionRef = db.collection(userType);
    await collectionRef.doc(uid).set({
      providerType,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      companyName: providerType === "company" ? companyName : undefined,
      businessTaxNumber: providerType === "company" ? businessTaxNumber : undefined,
      mobileNumber,
      address: { streetNumber, streetName, city, state, postCode },
    }, { merge: true });

    return successResponse(res, HTTP_STATUS_CODE.OK, { uid, email, providerType });
  } catch (error: any) {
    console.error(logPrefix(Log.ERROR) + ":", error);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR");
  }
}

async function loginUser(req: express.Request, res: express.Response, userType: "clients" | "contractors") {
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, "AUTH_HEADER_MISSING");
    }

    const decodedString = Buffer.from(authorizationHeader, "base64").toString("utf-8");
    if (!decodedString.startsWith("SMP:")) {
      return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, "INVALID_CREDS_FORMAT");
    }

    const credentials = decodedString.slice(4).split("*");
    if (credentials.length !== 2) {
      return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, "INVALID_CREDS_FORMAT");
    }

    const [email, password] = credentials;
    const user = await admin.auth().getUserByEmail(email);
    const userDoc = await db.collection(userType).doc(user.uid).get();
    if (!userDoc.exists) {
      return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, "USER_NOT_FOUND");
    }

    const userData = userDoc.data();
    const isPasswordValid = await bcrypt.compare(password, userData?.password);
    if (!isPasswordValid) {
      return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, "INVALID_PASSWORD");
    }

    const token = jwt.sign({ uid: user.uid }, JWT_SECRET_KEY, { expiresIn: "1h" });
    return successResponse(res, HTTP_STATUS_CODE.OK, { uid: user.uid, email: user.email, token });
  } catch (error: any) {
    console.error(logPrefix(Log.ERROR) + ":", error);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR");
  }
}

export function loginClient(req: express.Request, res: express.Response) {
  return loginUser(req, res, "clients");
}

export function loginContractor(req: express.Request, res: express.Response) {
  return loginUser(req, res, "contractors");
}
