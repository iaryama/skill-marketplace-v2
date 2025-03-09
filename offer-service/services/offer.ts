import { Offer } from '../models/offer';

export async function createOffer({
  taskId,
  user_id,
  price,
  proposal,
}: {
  taskId: number;
  user_id: number;
  price: number;
  proposal: string;
}) {
  return await Offer.create({ taskId, user_id, price, proposal, status: 'pending' });
}

export async function getOfferById(id: number) {
  return await Offer.findByPk(id);
}

export async function getOffersByTask(taskId: number) {
  return await Offer.findAll({ where: { taskId } });
}
