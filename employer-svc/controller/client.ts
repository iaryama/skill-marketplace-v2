import express from "express";
import libphonenumber from "google-libphonenumber";
import { validationResult, query, body } from "express-validator";
import admin from "firebase-admin";
import { db } from "../utils/connectFirestore";
import { sendEmail } from "../utils/sendEmail";
import { getCurrentISTDateTime } from "../helpers/miscellaneous";
import { successResponse, failureResponse } from "../helpers/responseHelpers";
import { APP_LOGIN_URL, SEND_EMAIL_FROM } from "../utils/constants";
import { emailTemplate as signedInUserWelcomeTemplate } from "../emailTemplates/signedInUserWelcome";
import { emailTemplate as pwdResetTemplate } from "../emailTemplates/passwordResetTemplate";
const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

export const validationCheckAdminUser = [query("emailId").isEmail().notEmpty()];

export async function checkIfAdminUser(req: express.Request, res: express.Response) {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there are validation errors, send a response with the errors
      return failureResponse(res, 400, errors.array());
    }
    const user = await admin.auth().getUserByEmail(req.query.emailId.toString());
    // Collection Reference
    const collectionRef = db.collection("adminusers");
    const docRef = collectionRef.doc("/" + user.uid);
    const doc = await docRef.get();
    if (doc.exists) {
      return successResponse(res, 200, { isAdminUser: true });
    } else {
      return successResponse(res, 200, { isAdminUser: false });
    }
  } catch (error: any) {
    if (error.code && error.code === "auth/user-not-found") {
      return successResponse(res, 200, { isAdminUser: false });
    }
    console.error(getCurrentISTDateTime() + ":", error);
    return failureResponse(res, 500, "INTERNAL_SERVER_ERROR");
  }
}

export const validationCheckUserExists = [
  query("phoneNo")
    .optional()
    .custom((value: string, { req }) => {
      // Parse number with country code and keep raw input.
      const num = phoneUtil.parseAndKeepRawInput(value, req.query.iso_code.toString());
      if (phoneUtil.isValidNumber(num)) {
        return true;
      } else {
        return false;
      }
    })
    .withMessage("Not a valid mobile no")
    .notEmpty(),
  query("iso_code")
    .optional()
    .isString()
    .matches(/^[A-Za-z]{2,3}$/)
    .notEmpty(),
  query("emailId").optional().isEmail().notEmpty(),
];

export async function checkIfUserExists(req: express.Request, res: express.Response) {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there are validation errors, send a response with the errors
      return failureResponse(res, 400, errors.array());
    }
    if (!req.query.phoneNo && !req.query.emailId) {
      return failureResponse(res, 400, "EMAIL_OR_PHONE_NO_REQUIRED");
    }
    let userRecord: any;
    if (req.query.emailId) {
      userRecord = await admin.auth().getUserByEmail(req.query.emailId as string);
    } else if (req.query.phoneNo) {
      const num = phoneUtil.parseAndKeepRawInput(
        req.query.phoneNo as string,
        req.query.iso_code as string
      );
      const phone = "+" + num.getCountryCode() + req.query.phoneNo;
      userRecord = await admin.auth().getUserByPhoneNumber(phone as string);
    } else {
      throw new Error("Either Email/Phone No Should be in the  Request to check the User");
    }

    // Collection Reference
    const collectionRef = db.collection("users");
    const docRef = collectionRef.doc("/" + userRecord.uid);
    const doc = await docRef.get();
    if (!doc.exists) {
      console.error(
        getCurrentISTDateTime() + ":",
        "User is Present in Auth but Document doesnt exist"
      );
      return res
        .status(200)
        .json({ userExists: false, message: "User is Present in Auth but Document doesnt exist" });
    }

    return successResponse(res, 200, { userExists: true });
  } catch (error: any) {
    if (error.code && error.code === "auth/user-not-found") {
      return successResponse(res, 200, { userExists: false });
    }
    console.error(getCurrentISTDateTime() + ":", error);
    return res
      .status(500)
      .json({ code: "INTERNAL_SERVER_ERROR", message: "Internal server error" });
  }
}
export const validationCheckaddOrEditUser = [
  body("name").optional().isString(),
  body("emailId").optional().isEmail().notEmpty(),
  body("address").optional().isString().notEmpty(),
  body("country").optional().isString().notEmpty(),
  body("state").optional().isString().notEmpty(),
  body("city").optional().isString().notEmpty(),
  body("pincode")
    .optional()
    .isString()
    .matches(/^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$/)
    .notEmpty(),
  body("iso_code")
    .optional()
    .isString()
    .matches(/^[A-Za-z]{2,3}$/)
    .notEmpty(),
  body("phoneNo")
    .optional()
    .isString()
    .custom((value: string, { req }) => {
      // Parse number with country code and keep raw input.
      const num = phoneUtil.parseAndKeepRawInput(value, req.body.iso_code);
      return phoneUtil.isValidNumber(num);
    }),
];
export async function addOrEditUser(req: express.Request, res: express.Response) {
  let collectionName = "users";
  //@ts-ignore
  if (req.userType === "agent") {
    collectionName = "adminusers";
  }
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return failureResponse(res, 400, errors.array());
    }
    const { iso_code, phoneNo, emailId } = req.body;
    // Collection Reference
    const collectionRef = db.collection(collectionName);
    //@ts-ignore
    const docRef = collectionRef.doc("/" + req.uid);
    const doc = await docRef.get();
    const data: any = {};
    if (!phoneNo && !emailId) {
      return failureResponse(res, 400, "RMAIL_OR_PHONE_NO_REQUIRED");
    }
    const fieldsToUpdate = [
      "address",
      "country",
      "state",
      "city",
      "pincode",
      "name",
      "emailId",
      "isNewSignedInUser",
    ];

    fieldsToUpdate.forEach((field) => {
      if (field in req.body) {
        data[field] = req.body[field];
      }
    });
    if (phoneNo) {
      const num = phoneUtil.parseAndKeepRawInput(phoneNo, iso_code);
      const phone = "+" + num.getCountryCode() + phoneNo;
      data.phone = phone;
      data.isNewSignedInUser = false;
    }
    if (emailId) {
      const snapshot = await collectionRef.where("emailId", "==", emailId).get();
      if (!snapshot.empty) {
        const { docs } = snapshot;
        if (docs.length > 1) {
          return res
            .status(400)
            .json({ message: "Multiple Users with this Email Exists", code: "EMAIL_EXISTS" });
        } else if (docs.length == 1) {
          const [doc] = docs;
          //@ts-ignore
          if (doc.id !== req.uid) {
            return res
              .status(400)
              .json({ message: "User with this Email Already Exists", code: "EMAIL_EXISTS" });
          }
        }
      }
    }
    const timestamp = new Date();
    data.updatedAt = timestamp;
    if (data.name) {
      data.name = data.name[0].toUpperCase() + data.name.substring(1, data.name.length);
    }

    //Send Welcome Email if Doc Doesnt Exist or Doc Exists and First time Email Is Being Associated to It
    if (!doc.exists || (doc.exists && !("emailId" in doc.data()))) {
      data.isNewSignedInUser = true;
      data.createdAt = timestamp;
      if (emailId) {
        const { subject, emailHTMLTemplate, emailTextTemplate } = signedInUserWelcomeTemplate(
          data.name as string,
          emailId,
          APP_LOGIN_URL as string
        );
        const msg = {
          to: req.body.emailId,
          from: SEND_EMAIL_FROM as string,
          subject,
          text: emailTextTemplate,
          html: emailHTMLTemplate,
        };
        await sendEmail(msg);
      }
    }
    //If phone no already exists, delete it
    if (doc.exists && doc && doc.data() && "phone" in doc.data()) {
      delete data.phone;
    }

    await docRef.set(data, { merge: true });
    return successResponse(res, 200, { msg: "USER_SAVED_SUCCESSFULLY" });
  } catch (error: any) {
    console.error(getCurrentISTDateTime() + ":", "Error in saving user");
    console.error(getCurrentISTDateTime() + ":", error);
    return failureResponse(res, 500, "INTERNAL_SERVER_ERROR");
  }
}

export const validationCheckResetEmailPwd = [body("emailId").optional().isEmail().notEmpty()];
export async function resetEmailPwd(req: express.Request, res: express.Response) {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return failureResponse(res, 400, errors.array());
    }
    const { emailId } = req.body;
    const user = await admin.auth().getUserByEmail(emailId);
    const collectionRef = db.collection("users");
    const docRef = collectionRef.doc("/" + user.uid);
    const doc = await docRef.get();
    const { name } = doc.data();
    const link = await admin.auth().generatePasswordResetLink(emailId);

    const { subject, emailHTMLTemplate, emailTextTemplate } = pwdResetTemplate(name, link);
    const msg = {
      to: req.body.emailId,
      from: SEND_EMAIL_FROM as string,
      subject,
      text: emailTextTemplate,
      html: emailHTMLTemplate,
    };
    await sendEmail(msg);

    return successResponse(res, 200, { msg: "EMAIL_SENT" });
  } catch (error: any) {
    if (error.code && error.code === "auth/user-not-found") {
      return failureResponse(res, 400, "USER_NOT_EXIST");
    }
    console.error(getCurrentISTDateTime + ":", "Error in Reset Pwd");
    console.error(getCurrentISTDateTime() + ":", error);
    return failureResponse(res, 500, "INTERNAL_SERVER_ERROR");
  }
}
export const validationCheckIfNewUser = [
  query("phoneNo")
    .optional()
    .custom((value: string, { req }) => {
      // Parse number with country code and keep raw input.
      const num = phoneUtil.parseAndKeepRawInput(value, req.query.iso_code.toString());
      if (phoneUtil.isValidNumber(num)) {
        return true;
      } else {
        return false;
      }
    })
    .withMessage("Not a valid mobile no")
    .notEmpty(),
  query("iso_code")
    .optional()
    .isString()
    .matches(/^[A-Za-z]{2,3}$/)
    .notEmpty(),
  query("emailId").optional().isEmail().notEmpty(),
];
export async function checkIfNewUser(req: express.Request, res: express.Response) {
  let collectionName = "users";
  //@ts-ignore
  if (req.userType === "agent") {
    collectionName = "adminusers";
  }
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there are validation errors, send a response with the errors
      return failureResponse(res, 400, errors.array());
    }
    if (!req.query.phoneNo && !req.query.emailId) {
      return failureResponse(res, 400, "EMAIL_OR_PHONE_NO_REQUIRED");
    }
    let userRecord: any;
    try {
      if (req.query.emailId) {
        userRecord = await admin.auth().getUserByEmail(req.query.emailId as string);

        // Collection Reference
        const collectionRef = db.collection(collectionName);
        const docRef = collectionRef.doc("/" + userRecord.uid);
        const doc = await docRef.get();
        if (!doc.exists) {
          return successResponse(res, 200, { isNewUser: true });
        } else {
          const data = doc.data();
          return successResponse(res, 200, { isNewUser: data.isNewSignedInUser });
        }
      } else {
        throw new Error("EmailId is Not present in Request");
      }
    } catch (error: any) {
      if (
        (error.code && error.code === "auth/user-not-found") ||
        (error.message && error.message === "EmailId is Not present in Request")
      ) {
        if (req.query.phoneNo) {
          const num = phoneUtil.parseAndKeepRawInput(
            req.query.phoneNo as string,
            req.query.iso_code as string
          );
          const phone = "+" + num.getCountryCode() + req.query.phoneNo;
          userRecord = await admin.auth().getUserByPhoneNumber(phone as string);
          // Collection Reference
          const collectionRef = db.collection(collectionName);
          const docRef = collectionRef.doc("/" + userRecord.uid);
          const doc = await docRef.get();
          if (!doc.exists) {
            return successResponse(res, 200, { isNewUser: true });
          } else {
            const data = doc.data();
            return successResponse(res, 200, { isNewUser: data.isNewSignedInUser });
          }
        } else {
          throw new Error("Phone No is Not present in the  Request to check the User");
        }
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    if (error.code && error.code === "auth/user-not-found") {
      return res
        .status(200)
        .json({ userExists: false, message: "User is Not present At all in the System" });
    }
    console.error(getCurrentISTDateTime() + ":", error);
    return res
      .status(500)
      .json({ code: "INTERNAL_SERVER_ERROR", message: "Internal server error" });
  }
}
