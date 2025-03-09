import { Offer } from '../models/offer';

export async function createOffer({
  task_id,
  user_id,
  price,
  proposal,
}: {
  task_id: number;
  user_id: number;
  price: number;
  proposal: string;
}) {
  return await Offer.create({ task_id, user_id, price, proposal, status: 'pending' });
}

export async function getOfferById(id: number) {
  return await Offer.findByPk(id);
}

export async function getOffersByTask(task_id: number) {
  return await Offer.findAll({ where: { task_id } });
}
