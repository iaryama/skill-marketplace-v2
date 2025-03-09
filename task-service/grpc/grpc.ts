import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Task } from '../models/task';
import { Skill } from '../models/skill';

const packageDef = protoLoader.loadSync('proto/task.proto', {});
const grpcObj = grpc.loadPackageDefinition(packageDef) as any;
const taskPackage = grpcObj.task;

export const grpcServer = new grpc.Server();
grpcServer.addService(taskPackage.TaskService.service, {
  GetTaskById: async (call: any, callback: any) => {
    const task = await Task.findByPk(call.request.id, {
      include: [
        {
          model: Skill,
          through: { attributes: [] },
        },
      ],
    });
    if (task) {
      callback(null, {
        id: task.id,
        taskName: task.taskName,
        description: task.description,
        categoryId: task.categoryId,
        //@ts-ignore
        skillIds: task.Skills.map((skill) => skill.id),
      });
    } else {
      callback({ code: grpc.status.NOT_FOUND, message: 'Task not found' });
    }
  },
});
