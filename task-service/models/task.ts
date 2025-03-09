import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';
import { Category } from './category';

class Task extends Model {
  public id!: number;
  public taskName!: string;
  public categoryId!: number;
  public userId!: number;
}

Task.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    taskName: { type: DataTypes.STRING, allowNull: false },
    categoryId: { type: DataTypes.INTEGER, references: { model: Category, key: 'id' } },
    userId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, modelName: 'Task', tableName: 'tasks', schema: 'tasks', timestamps: true },
);

export { Task };
