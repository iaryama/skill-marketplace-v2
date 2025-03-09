import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';
import { Category } from './category';

class Skill extends Model {
  public id!: number;
  public name!: string;
  public categoryId!: number;
  public categoryName?: string;
}

Skill.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    categoryId: { type: DataTypes.INTEGER, references: { model: Category, key: 'id' } },
  },
  { sequelize, modelName: 'Skill', tableName: 'skills', schema: 'skills', timestamps: true },
);

// Define association with Category
Skill.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

export { Skill };
