import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Task } from '../models/task';
import { Skill } from '../models/skill';
import { Category } from '../models/category';

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
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: Category,
          attributes: ['id', 'name'],
        },
      ],
    });

    if (task) {
      callback(null, {
        id: task.id,
        taskName: task.taskName,
        description: task.description,
        category: {
          //@ts-ignore
          id: task.Category.id,
          //@ts-ignore
          name: task.Category.name,
        },
        //@ts-ignore
        skills: task.Skills.map((skill) => ({ id: skill.id, name: skill.name })),
      });
    } else {
      callback({ code: grpc.status.NOT_FOUND, message: 'Task not found' });
    }
  },
});
