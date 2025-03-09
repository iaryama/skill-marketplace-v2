import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';
import { Category } from './category';

class Skill extends Model {
  public id!: number;
  public name!: string;
  public categoryId!: number;
}

Skill.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    categoryId: { type: DataTypes.INTEGER, references: { model: Category, key: 'id' } },
  },
  { sequelize, modelName: 'Skill', tableName: 'skills', schema: 'skills', timestamps: true },
);

export { Skill };
