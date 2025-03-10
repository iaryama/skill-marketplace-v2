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

      callback(null, {
        id: task.dataValues.id,
        task_name: task.dataValues.task_name || '',
        description: task.dataValues.description || '',
        start_date: task.dataValues.start_date ? task.dataValues.start_date.toISOString() : '',
        no_of_working_hours: task.dataValues.no_of_working_hours || 0,
        hourly_rate: parseFloat(task.dataValues.hourly_rate) || 0.0,
        currency: task.dataValues.currency || 'USD',
        user_id: task.dataValues.user_id || 0,
        category: {
          id: task.dataValues.Category?.id || 0,
          name: task.dataValues.Category?.name || '',
        },
        status: task.dataValues.status || '',
        progress: task.dataValues.progress || '',
      });
    } catch (error) {
      Logger.ERROR(error);
      callback({ code: grpc.status.INTERNAL, message: 'Internal server error' });
    }
  },
});
