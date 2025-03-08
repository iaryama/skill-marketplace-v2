import express from "express";
import { validationResult, body } from "express-validator";
import { db } from "../db/connectFirestore";
import { successResponse, failureResponse } from "../helpers/responseHelpers";
import { HTTP_STATUS_CODE, Log } from "../helpers/constants";
import { Logger } from "../helpers/logger";

// Validation Rules
export const createTaskValidation = [
  body("category").isString().notEmpty(),
  body("taskName").isString().notEmpty(),
  body("description").isString().notEmpty(),
  body("expectedStartDate").isISO8601().notEmpty(),
  body("expectedHours").isInt({ min: 1 }),
  body("hourlyRate").isFloat({ min: 1 }),
  body("currency").isIn(["USD", "AUD", "SGD", "INR"]).notEmpty(),
];

export async function createTask(req: express.Request, res: express.Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, errors.array());

    //@ts-ignore
    const { uid } = req;
    const taskRef = db.collection("tasks").doc();
    const {category} = req.body as {category: string};
    const categoryDoc = await db.collection("categories").doc(category).get();
    if (!categoryDoc.exists) return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, "CATEGORY_NOT_FOUND");
    await taskRef.set({ ...req.body, clientId: uid, status: "OPEN" });

    return successResponse(res, HTTP_STATUS_CODE.CREATED, { taskId: taskRef.id });
  } catch (error) {
    Logger.ERROR(error);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR");
  }
}

export const updateTaskValidation = [
  body("category").optional().isString().notEmpty(),
  body("taskName").optional().isString().notEmpty(),
  body("description").optional().isString().notEmpty(),
  body("expectedStartDate").optional().isISO8601().notEmpty(),
  body("expectedHours").optional().isInt({ min: 1 }),
  body("hourlyRate").optional().isFloat({ min: 1 }),
  body("currency").optional().isIn(["USD", "AUD", "SGD", "INR"]).notEmpty(),
  body("status").optional().isIn(["OPEN", "CLOSED", "COMPLETED"]).notEmpty(),
];

export async function updateTask(req: express.Request, res: express.Response) {
  try {
    const { taskId } = req.params;
    const taskRef = db.collection("tasks").doc(taskId);
    const task = await taskRef.get();

    if (!task.exists) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, "TASK_NOT_FOUND");

    await taskRef.update(req.body);
    return successResponse(res, HTTP_STATUS_CODE.OK, { taskId, updatedData: req.body });
  } catch (error) {
    Logger.ERROR(error);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR");
  }
}

export async function getTask(req: express.Request, res: express.Response) {
  try {
    const { taskId } = req.params;
    const taskRef = db.collection("tasks").doc(taskId);
    const task = await taskRef.get();

    if (!task.exists) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, "TASK_NOT_FOUND");

    return successResponse(res, HTTP_STATUS_CODE.OK, task.data());
  } catch (error) {
    Logger.ERROR(error);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR");
  }
}
