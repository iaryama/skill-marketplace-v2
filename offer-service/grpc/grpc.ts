import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { createOffer, getOfferById, getOffersByTask } from '../services/offer';

const packageDef = protoLoader.loadSync('proto/offer.proto', {});
const grpcObj = grpc.loadPackageDefinition(packageDef) as any;
const offerPackage = grpcObj.offer;

export const grpcServer = new grpc.Server();

grpcServer.addService(offerPackage.OfferService.service, {
  CreateOffer: async (call: any, callback: any) => {
    try {
      const offer = await createOffer(call.request);
      callback(null, { success: true, offerId: offer.id });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  GetOfferById: async (call: any, callback: any) => {
    try {
      const offer = await getOfferById(call.request.id);
      if (!offer) {
        return callback({ code: grpc.status.NOT_FOUND, message: 'Offer not found' });
      }
      callback(null, offer);
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  GetOffersByTask: async (call: any, callback: any) => {
    try {
      const offers = await getOffersByTask(call.request.taskId);
      callback(null, { offers });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
});
