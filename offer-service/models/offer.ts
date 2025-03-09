import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';
import { Currency } from '../helpers/constants';

class Offer extends Model {
  public id!: number;
  public task_id!: number;
  public user_id!: number;
  public currency!: Currency;
  public hourly_rate!: number;
  public proposal!: string;
  public status!: string;
}

Offer.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    task_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    hourly_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.ENUM({ values: Object.values(Currency) }), allowNull: false },
    proposal: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  },
  { sequelize, modelName: 'Offer', tableName: 'offers', schema: 'tasks', timestamps: true },
);

export { Offer };
