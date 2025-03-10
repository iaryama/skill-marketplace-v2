import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Task } from '../models/task';
import { Category } from '../models/category';
import { Logger } from '../helpers/logger';

const packageDef = protoLoader.loadSync('proto/task.proto', {});
const grpcObj = grpc.loadPackageDefinition(packageDef) as any;
const taskPackage = grpcObj.task;

export const grpcServer = new grpc.Server();
grpcServer.addService(taskPackage.TaskService.service, {
  GetTaskById: async (call: any, callback: any) => {
    try {
      const task = await Task.findByPk(call.request.id, {
        include: [{ model: Category, attributes: ['id', 'name'] }],
      });

      if (!task) {
        return callback({ code: grpc.status.NOT_FOUND, message: 'Task not found' });
      }

      console.log(task.dataValues);

      const response = {
        id: task.dataValues.id,
        task_name: task.dataValues.task_name || '',
        description: task.dataValues.description || '',
        start_date: task.dataValues.start_date ? task.dataValues.start_date.toISOString() : '',
        no_of_working_hours: task.dataValues.no_of_working_hours,
        hourly_rate: task.dataValues.hourly_rate,
        currency: task.dataValues.currency,
        user_id: task.dataValues.user_id,
        category: {
          id: task.dataValues.Category?.id,
          name: task.dataValues.Category?.name || '',
        },
        status: task.dataValues.status || '',
        progress: task.dataValues.progress || '',
      };
      console.log('Response ', response);

      callback(null, response);
    } catch (error) {
      Logger.ERROR(error);
      callback({ code: grpc.status.INTERNAL, message: 'Internal server error' });
    }
  },
});
