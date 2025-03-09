import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';
import { Category } from './category';
import { Skill } from './skill';

class Task extends Model {
  public id!: number;
  public task_name!: string;
  public category_id!: number;
  public user_id!: number;
  public description!: string;
}

Task.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    task_name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    category_id: { type: DataTypes.INTEGER, references: { model: Category, key: 'id' } },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, modelName: 'Task', tableName: 'tasks', schema: 'tasks', timestamps: true },
);

// Define many-to-many relationship
Task.belongsToMany(Skill, { through: 'task_skills', foreignKey: 'task_id' });

// Define association with Category
Task.belongsTo(Category, { foreignKey: 'category_id' });

export { Task };
