import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Task } from '../models/task';
import { Category } from '../models/category';

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

      callback(null, {
        id: task.id,
        task_name: task.task_name,
        description: task.description,
        start_date: task.start_date.toISOString(),
        no_of_working_hours: task.no_of_working_hours,
        hourly_rate: parseFloat(task.dataValues.hourly_rate),
        currency: task.currency,
        category: { id: task.dataValues.category.id, name: task.dataValues.category.name },
        status: task.dataValues.status,
        progress: task.dataValues.progress || '',
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: 'Internal server error' });
    }
  },
});
