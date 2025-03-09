import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';

class Offer extends Model {
  public id!: number;
  public task_id!: number;
  public user_id!: number;
  public price!: number;
  public proposal!: string;
  public status!: string;
}

Offer.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    task_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    proposal: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  },
  { sequelize, modelName: 'Offer', tableName: 'offers', schema: 'tasks', timestamps: true },
);

export { Offer };
