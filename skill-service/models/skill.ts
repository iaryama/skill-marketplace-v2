import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';
import { Category } from './category';
import { User } from './user';
import { Currency, NatureOfWork } from '../helpers/constants';

class Skill extends Model {
  public id!: number;
  public name!: string;
  public category_id!: number;
  public categoryName?: string;
  public experience!: number;
  public nature_of_work!: NatureOfWork;
  public hourly_rate!: number;
  public currency!: Currency;
  public user_id!: number;
}

Skill.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
    name: { type: DataTypes.STRING, allowNull: false },
    experience: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    nature_of_work: { type: DataTypes.ENUM({ values: Object.values(NatureOfWork) }), allowNull: false },
    hourly_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.ENUM({ values: Object.values(Currency) }), allowNull: false },
    category_id: { type: DataTypes.INTEGER, references: { model: Category, key: 'id' } },
  },
  { sequelize, modelName: 'Skill', tableName: 'skills', schema: 'skills', timestamps: true },
);

// Define association with Category
Skill.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

export { Skill };
