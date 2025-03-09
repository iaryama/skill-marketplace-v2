import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Task } from '../models/task';

const packageDef = protoLoader.loadSync('proto/task.proto', {});
const grpcObj = grpc.loadPackageDefinition(packageDef) as any;
const taskPackage = grpcObj.task;

export const grpcServer = new grpc.Server();
grpcServer.addService(taskPackage.TaskService.service, {
  GetTaskById: async (call: any, callback: any) => {
    const task = await Task.findByPk(call.request.id);
    if (task) callback(null, { id: task.id, taskName: task.taskName, categoryId: task.categoryId });
    else callback({ code: grpc.status.NOT_FOUND, message: 'Task not found' });
  },
});
