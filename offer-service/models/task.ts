import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';
import { Category } from './category';
import { Skill } from './skill';

class Task extends Model {
  public id!: number;
  public taskName!: string;
  public categoryId!: number;
  public userId!: number;
  public description!: string;
}

Task.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    taskName: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    categoryId: { type: DataTypes.INTEGER, references: { model: Category, key: 'id' } },
    userId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, modelName: 'Task', tableName: 'tasks', schema: 'tasks', timestamps: true },
);

// Define many-to-many relationship
Task.belongsToMany(Skill, { through: 'task_skills', foreignKey: 'taskId' });

// Define association with Category
Task.belongsTo(Category, { foreignKey: 'categoryId' });

export { Task };
