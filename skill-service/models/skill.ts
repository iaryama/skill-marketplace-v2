import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';
import { Category } from './category';
import { User } from './user';

enum NatureOfWork {
  Online = 'online',
  Onsite = 'onsite',
}

class Skill extends Model {
  public id!: number;
  public name!: string;
  public categoryId!: number;
  public categoryName?: string;
}

Skill.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
    name: { type: DataTypes.STRING, allowNull: false },
    experience: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    nature_of_work: { type: DataTypes.ENUM({ values: Object.values(NatureOfWork) }), allowNull: false },
    hourly_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    categoryId: { type: DataTypes.INTEGER, references: { model: Category, key: 'id' } },
  },
  { sequelize, modelName: 'Skill', tableName: 'skills', schema: 'skills', timestamps: true },
);

// Define association with Category
Skill.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

export { Skill };
