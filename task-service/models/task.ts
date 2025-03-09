import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';
import { Category } from './category';

class Task extends Model {
  public id!: number;
  public taskName!: string;
  public category_id!: number;
  public user_id!: number;
  public description!: string;
}

Task.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    taskName: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    category_id: { type: DataTypes.INTEGER, references: { model: Category, key: 'id' } },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, modelName: 'Task', tableName: 'tasks', schema: 'tasks', timestamps: true },
);

// Define association with Category
Task.belongsTo(Category, { foreignKey: 'category_id' });

export { Task };
