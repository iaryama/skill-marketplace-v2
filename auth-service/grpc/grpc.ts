import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { User } from '../models/user';
const packageDef = protoLoader.loadSync('proto/auth.proto', {});
const grpcObj = grpc.loadPackageDefinition(packageDef) as any;
const authPackage = grpcObj.auth;

export const grpcServer = new grpc.Server();
grpcServer.addService(authPackage.AuthService.service, {
  GetUserById: async (call: any, callback: any) => {
    const user = await User.findByPk(call.request.id);
    if (user) callback(null, { id: user.id, email: user.email, role: user.role });
    else callback({ code: grpc.status.NOT_FOUND, message: 'User not found' });
  },
});
