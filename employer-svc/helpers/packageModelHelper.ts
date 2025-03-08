import { Model, Op } from "sequelize";
import { Packages } from "../models/packages";
export async function getPackages(package_ids?: number[]): Promise<Model[]> {
  const where = {} as any;
  if (package_ids) {
    where["package_id"] = {
      [Op.in]: package_ids,
    };
  }
  // Fetch the package details from the DB
  const data = await Packages.findAll({
    where,
    attributes: {
      exclude: ["pricing"],
    },
  });
  return data;
}

export async function getPackage(package_id: string): Promise<Model> {
  // Fetch the package details from the DB
  const data = await Packages.findOne({
    where: { package_id },
  });
  return data;
}
