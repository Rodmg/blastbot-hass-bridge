import {
  Table,
  Column,
  DataType,
  BelongsTo,
  BeforeBulkDestroy,
  BeforeDestroy,
  ForeignKey,
} from "sequelize-typescript";
import { BaseModel } from "@/libraries/BaseModel";
import { Control } from "./Control";

@Table({
  tableName: "acsettings",
})
export class ACSettings extends BaseModel<ACSettings> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "25",
  })
  temperature: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "low",
  })
  fan: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  timer?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  mode?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: "off",
  })
  state?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  pastState?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  sleepTime?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  get dictionary(): any {
    let pl = "";
    try {
      pl = JSON.parse(this.getDataValue("dictionary"));
    } catch (err) {
      pl = "";
    }
    return pl;
  }

  set dictionary(value: any) {
    let pl = "";
    if (typeof value === "string") pl = value;
    else {
      try {
        pl = JSON.stringify(value);
      } catch (err) {
        pl = "";
      }
    }
    this.setDataValue("dictionary", pl);
  }

  @ForeignKey(() => Control)
  @Column({ type: DataType.INTEGER })
  controlId: number;

  @BelongsTo(() => Control, { hooks: true, onDelete: "CASCADE" })
  control: Control;

  @BeforeBulkDestroy
  static beforeBulkDestroyHook(options: any) {
    if (options != null) options.individualHooks = true;
  }

  @BeforeDestroy
  static beforeDestroyHook(_acsettings: ACSettings) {
    return Promise.all([]);
  }
}
