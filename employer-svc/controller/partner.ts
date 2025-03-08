import express from "express";

import { validationResult, body } from "express-validator";
import { getCurrentISTDateTime } from "../helpers/miscellaneous";
import { SEND_EMAIL_FROM, JWT_SECRET_KEY } from "../utils/constants";
import admin from "firebase-admin";
import { db } from "../utils/connectFirestore";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendEmail";
import { emailTemplate as partnerWelcomeTemplate } from "../emailTemplates/partnerWelcome";
import { Packages } from "../models/packages";
import { Op } from "sequelize";
import { failureResponse, successResponse } from "../helpers/responseHelpers";

export const signUpValidation = [
  body("partner_name")
    .isString()
    .matches(/^[a-zA-Z.\s]+(\|[a-zA-Z.\s]+)*$/)
    .notEmpty(),
  body("email").isEmail().notEmpty(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one digit")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),
  body("package_ids")
    .isArray()
    .withMessage("Package Ids should be an Array")
    .custom((package_ids: number[]) => {
      if (!package_ids.every((id) => typeof id === "number")) {
        throw new Error("All elements in Package Ids array should be numbers");
      }
      return true;
    }),
  body("ips")
    .isArray({ min: 1, max: 2 })
    .withMessage("IPs should be an array and not empty.")
    .custom((ips: string[]) => {
      for (let ip of ips) {
        if (!body().isIP().run({ body: { ip } })) {
          throw new Error("Each IP should be in a valid IP format.");
        }
      }
      return new Set(ips).size === ips.length;
    })
    .withMessage("Each IP should be Unique.")
    .notEmpty(),
];
/**
 *  Add Partner to the Platform
 * @param req
 * @param res
 * @returns
 */
export async function signUp(req: express.Request, res: express.Response) {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there are validation errors, send a response with the errors
      return failureResponse(res, 400, errors.array());
    }
    const { partner_name, email, password, ips, package_ids } = req.body as {
      partner_name: string;
      email: string;
      password: string;
      ips: string[];
      package_ids: number[];
    };

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      if (userRecord) {
        return failureResponse(res, 400, "EMAIL_EXISTS");
      }
    } catch (error: any) {
      if (error.code && error.code !== "auth/user-not-found") {
        console.error(getCurrentISTDateTime() + ":", error);
        return failureResponse(res, 400, error.code);
      }
    }

    const packageIds: number[] = (
      await Packages.findAll({
        where: {
          package_id: {
            [Op.in]: package_ids,
          },
        },
        attributes: ["package_id"],
      })
    ).map((pkg) => Number(pkg.dataValues.package_id));
    if (!package_ids.every((package_id) => packageIds.includes(package_id))) {
      return failureResponse(res, 404, "PACKAGES_NOT_FOUND");
    }

    // Create the user in Firebase Auth
    const { uid } = await admin.auth().createUser({
      email,
      password, // The plain password is required here for Firebase Auth
      displayName: partner_name,
    });

    // Store partner information in Firestore
    const collectionRef = db.collection("partners");
    const docRef = collectionRef.doc(uid);
    await docRef.set(
      {
        partner_name,
        package_ids,
        email,
        ips,
        password: hashedPassword,
      },
      { merge: true }
    );

    const { subject, emailHTMLTemplate, emailTextTemplate } = partnerWelcomeTemplate(
      partner_name,
      email,
      password
    );
    const msg = {
      to: email,
      from: SEND_EMAIL_FROM,
      subject,
      text: emailTextTemplate,
      html: emailHTMLTemplate,
    };
    await sendEmail(msg);
    return successResponse(res, 200, { uid, email, partner_name });
  } catch (error: any) {
    console.error(getCurrentISTDateTime() + ":", error);
    if (error.code) {
      return failureResponse(res, 400, error.code);
    }
    return failureResponse(res, 500, "INTERNAL_SERVER_ERROR");
  }
}

/**
 *  Login Partner
 * @param req
 * @param res
 * @returns
 */
export async function login(req: express.Request, res: express.Response) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      return failureResponse(res, 400, "AUTH_HEADER_MISSING");
    }

    // Decode the Base64-encoded credentials
    const decodedString = Buffer.from(authorizationHeader, "base64").toString("utf-8");

    // Ensure the format is correct
    if (!decodedString.startsWith("BMD:")) {
      return failureResponse(res, 400, "INVALID_CREDS_FORMAT");
    }

    // Extract email and password
    const credentials = decodedString.slice(4).split("*");
    if (credentials.length !== 2) {
      return failureResponse(res, 400, "INVALID_CREDS_FORMAT");
    }

    const [email, password] = credentials;

    // Verify the user credentials
    const user = await admin.auth().getUserByEmail(email);
    const { uid } = user;

    // Get the user's document from Firestore
    const userDoc = await db.collection("partners").doc(uid).get();
    if (!userDoc.exists) {
      return failureResponse(res, 400, "USER_NOT_FOUND");
    }

    const userData = userDoc.data();
    const hashedPassword = userData?.password;

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordValid) {
      return failureResponse(res, 401, "INVALID_PASSWORD");
    }

    // Generate a custom token for the user
    const token = jwt.sign({ uid }, JWT_SECRET_KEY, { expiresIn: "1h" });
    return successResponse(res, 200, {
      uid: user.uid,
      email: user.email,
      token,
    });
  } catch (error: any) {
    console.error(getCurrentISTDateTime() + ":", error);
    if (error.code) {
      return failureResponse(res, 400, error.code);
    }
    return failureResponse(res, 500, "INTERNAL_SERVER_ERROR");
  }
}
