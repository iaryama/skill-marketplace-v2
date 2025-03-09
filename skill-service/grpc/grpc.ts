import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Skill } from '../models/skill';
import { Category } from '../models/category';

const packageDef = protoLoader.loadSync('proto/skill.proto', {});
const grpcObj = grpc.loadPackageDefinition(packageDef) as any;
const skillPackage = grpcObj.skill;

export const grpcServer = new grpc.Server();
grpcServer.addService(skillPackage.SkillService.service, {
  GetSkillById: async (call: any, callback: any) => {
    const skill = await Skill.findByPk(call.request.id, {
      include: [{ model: Category, as: 'category', attributes: ['name'] }],
    });
    if (!skill) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Skill not found' });
    }

    callback(null, {
      id: skill.id,
      name: skill.name,
      categoryId: skill.categoryId,
      //@ts-ignore
      categoryName: skill.category ? skill.category.name : '',
    });
  },
});
