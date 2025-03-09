import { Logger } from '../helpers/logger';
import { taskClient } from '../index';

// Function to call GetTaskById
export const getTaskById = (taskId: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    taskClient.GetTaskById({ id: taskId }, (error: any, response: any) => {
      if (error) {
        Logger.ERROR(error);
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
};
