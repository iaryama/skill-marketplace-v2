import express from "express";
import { validationResult, body } from "express-validator";
import { db } from "../db/connectFirestore";
import { successResponse, failureResponse } from "../helpers/responseHelpers";
import { HTTP_STATUS_CODE, Log } from "../helpers/constants";
import { Logger } from "../helpers/logger";

// Validation Rules
export const addSkillValidation = [
  body("skill").isString().notEmpty(),
  body("category").isString().notEmpty(),
  body("experience").isInt({ min: 0 }),
  body("natureOfWork").isIn(["onsite", "online"]).notEmpty(),
  body("hourlyRate").isFloat({ min: 1 }),
];


// Validation Rules
export const updateSkillValidation = [
  body("category").isString().notEmpty(),
  body("experience").isInt({ min: 0 }),
  body("natureOfWork").isIn(["onsite", "online"]).notEmpty(),
  body("hourlyRate").isFloat({ min: 1 }),
];

async function validateAndUpdateSkill(
  uid: string,
  skillId: string,
  skillData: any,
  res: express.Response
) {
  const { category } = skillData;
  const categoryDoc = await db.collection("categories").doc(category).get();
  if (!categoryDoc.exists) {
    return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, "CATEGORY_NOT_FOUND");
  }

  const skillRef = db.collection("skills").doc(skillId);
  const skill = await skillRef.get();
  if (!skill.exists) {
    const contractorRef = db.collection("contractors").doc(uid);
    await contractorRef.set(
      { skills: { [skillId]: skillData } },
      { merge: true }
    );
  }

  return successResponse(res, HTTP_STATUS_CODE.CREATED, { skillId: skillRef.id });
}

export async function addSkill(req: express.Request, res: express.Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, errors.array());
    }

    //@ts-ignore
    const { uid } = req;
    const skillData = req.body;
    const skillId = skillData.skill;

    return await validateAndUpdateSkill(uid, skillId, skillData, res);
  } catch (error) {
    Logger.ERROR(error);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR");
  }
}

export async function updateSkill(req: express.Request, res: express.Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, errors.array());
    }

    //@ts-ignore
    const { uid } = req;
    const { skillId } = req.params;
    const skillData = req.body;
    skillData.skill = skillId;

    return await validateAndUpdateSkill(uid, skillId, skillData, res);
  } catch (error) {
    Logger.ERROR(error);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR");
  }
}