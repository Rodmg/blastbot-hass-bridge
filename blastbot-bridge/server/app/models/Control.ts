import {
  Table,
  Column,
  HasOne,
  DataType,
  BelongsTo,
  BeforeBulkDestroy,
  BeforeDestroy,
  BeforeBulkCreate,
  BeforeCreate,
  ForeignKey,
  HasMany,
} from "sequelize-typescript";
import { BaseModel } from "@/libraries/BaseModel";
import { IRButton } from "./IRButton";
import { ACSettings } from "./ACSettings";
import { Switch } from "./Switch";
import { Device } from "./Device";

@Table({
  tableName: "control",
})
export class Control extends BaseModel<Control> {
  @Column({
    type: DataType.ENUM("ir", "ac", "switch"),
    allowNull: false,
  })
  type: "ir" | "ac" | "switch";

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  icon: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  order: number;

  @ForeignKey(() => Device)
  @Column({ type: DataType.INTEGER })
  deviceId: number;

  @BelongsTo(() => Device, { hooks: true })
  device: Device;

  @HasMany(() => IRButton, { constraints: false })
  buttons: IRButton[];

  @HasOne(() => ACSettings, { constraints: false })
  acSettings: ACSettings;

  @HasMany(() => Switch, { constraints: false })
  switches: Switch[];

  @BeforeBulkCreate
  static beforeBulkCreateHook(items: Array<Control>, options: any) {
    if (options != null) options.individualHooks = true;
  }

  @BeforeCreate
  static beforeCreateHook(control: Control, _options: any) {
    if (control.order > 0) return Promise.resolve();
    // Get next order
    return Control.findAll().then((controls: any) => {
      // Get next index
      let next = 1;
      const max = Math.max.apply(
        Math,
        controls.map(function (o) {
          if (o.order == null) return null;
          return o.order;
        }),
      );
      if (max === Number.NEGATIVE_INFINITY) next = 1;
      // When there are no previous items
      else next = max + 1;
      control.order = next;
    });
  }
  static filter(): any {
    const filter: any = {
      model: Control,
      required: false,
    };

    return filter;
  }
  @BeforeBulkDestroy
  static beforeBulkDestroyHook(options: any) {
    if (options != null) options.individualHooks = true;
  }

  @BeforeDestroy
  static beforeDestroyHook(control: Control) {
    return Promise.all([
      IRButton.destroy({ where: { controlId: control.id } }),
      ACSettings.destroy({ where: { controlId: control.id } }),
      Switch.destroy({ where: { controlId: control.id } }),
    ]);
  }
}
