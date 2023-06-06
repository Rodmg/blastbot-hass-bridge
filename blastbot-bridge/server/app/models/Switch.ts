import {
  Table,
  Column,
  DataType,
  BelongsTo,
  BeforeBulkDestroy,
  BeforeDestroy,
  BeforeBulkCreate,
  ForeignKey,
} from "sequelize-typescript";
import { BaseModel } from "@/libraries/BaseModel";
import { Control } from "./Control";

@Table({
  tableName: "switch",
})
export class Switch extends BaseModel<Switch> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  icon?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  color?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  state: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  order: number;

  @ForeignKey(() => Control)
  @Column({ type: DataType.INTEGER })
  controlId: number;

  @BelongsTo(() => Control, { hooks: true })
  control: Control;

  @BeforeBulkCreate
  @BeforeBulkDestroy
  static activateIndividualHooks(options: any) {
    if (options != null) options.individualHooks = true;
  }

  @BeforeDestroy
  static beforeDestroyHook(_item: Switch) {
    return Promise.all([]);
  }
}
