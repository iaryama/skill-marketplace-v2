import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';
import { Task } from './task';
import { User } from './user';

class Offer extends Model {
  public id!: number;
  public taskId!: number;
  public user_id!: number;
  public price!: number;
  public proposal!: string;
  public status!: string;
}

Offer.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    taskId: { type: DataTypes.INTEGER, references: { model: Task, key: 'id' }, allowNull: false },
    user_id: { type: DataTypes.INTEGER, references: { model: User, key: 'id' }, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    proposal: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  },
  { sequelize, modelName: 'Offer', tableName: 'offers', schema: 'tasks', timestamps: true },
);

Offer.belongsTo(Task, { foreignKey: 'taskId' });
Offer.belongsTo(User, { foreignKey: 'user_id' });

export { Offer };
