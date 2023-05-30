import { Model, Column, DataType } from "sequelize-typescript";

/* 
  BaseModel: 
  All models inherit from this class, 
  modify it to apply defaults to all your models.
*/

export class BaseModel<T extends Model<T>> extends Model<T> {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  toJSON() {
    return super.toJSON();
  }
}
