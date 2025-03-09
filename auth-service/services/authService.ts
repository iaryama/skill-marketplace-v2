import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/user';
import { JWT_SECRET_KEY } from '../configuration/config';
import { redisClient } from '../db/connectRedis';
import { ACCESS_EXPIRY, REFRESH_EXPIRY_SEC } from '../helpers/constants';

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new Error('Invalid credentials');
  }

  const accessToken = jwt.sign({ user_id: user.id, role: user.role }, JWT_SECRET_KEY, { expiresIn: ACCESS_EXPIRY });
  const refreshToken = generateRandomToken();

  await redisClient.set(refreshToken, user.id.toString(), { EX: REFRESH_EXPIRY_SEC });

  return { accessToken, refreshToken };
}

export async function refreshToken(oldRefreshToken: string) {
  const user_id = await redisClient.get(oldRefreshToken);
  if (!user_id) throw new Error('Invalid refresh token');
  const user = await User.findByPk(user_id);

  if (user === null) throw new Error('User not found');

  await redisClient.del(oldRefreshToken);

  const newRefreshToken = generateRandomToken();
  await redisClient.set(newRefreshToken, user_id, { EX: REFRESH_EXPIRY_SEC });

  const accessToken = jwt.sign({ user_id: user!.id, role: user!.role }, JWT_SECRET_KEY, { expiresIn: ACCESS_EXPIRY });

  return { accessToken, refreshToken: newRefreshToken };
}

function generateRandomToken() {
  return crypto.randomBytes(64).toString('hex');
}
