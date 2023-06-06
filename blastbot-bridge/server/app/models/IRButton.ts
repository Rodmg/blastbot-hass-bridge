import {
  Table,
  Column,
  DataType,
  BeforeBulkDestroy,
  BeforeDestroy,
  BelongsTo,
  BeforeBulkCreate,
  BeforeCreate,
  ForeignKey,
} from "sequelize-typescript";
import { BaseModel } from "@/libraries/BaseModel";
import { Control } from "./Control";

@Table({
  tableName: "irbutton",
})
export class IRButton extends BaseModel<IRButton> {
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
    type: DataType.STRING(2048),
    allowNull: false,
    defaultValue: "",
  })
  code: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: -1,
  })
  order: number;

  @Column({
    type: DataType.ENUM("ir", "rf"),
    allowNull: false,
    defaultValue: "ir",
  })
  type: "ir" | "rf";

  @ForeignKey(() => Control)
  @Column({ type: DataType.INTEGER })
  controlId: number;

  @BelongsTo(() => Control, { hooks: true })
  control: Control;

  @BeforeBulkCreate
  static beforeBulkCreateHook(_tems: Array<IRButton>, options: any) {
    if (options != null) options.individualHooks = true;
  }

  @BeforeCreate
  static beforeCreateHook(button: IRButton, _options: any) {
    if (button.order >= 0) return Promise.resolve();
    // Get next order
    return IRButton.findAll({ where: { controlId: button.controlId } }).then(
      (buttons: any) => {
        // Get next index
        let next = 0;
        const max = Math.max.apply(
          Math,
          buttons.map(function (o) {
            if (o.order == null) return null;
            return o.order;
          }),
        );
        if (max === Number.NEGATIVE_INFINITY) next = 0;
        // When there are no previous items
        else next = max + 1;
        button.order = next;
      },
    );
  }
  @BeforeBulkDestroy
  static beforeBulkDestroyHook(options: any) {
    if (options != null) options.individualHooks = true;
  }

  @BeforeDestroy
  static beforeDestroyHook(_item: IRButton) {
    return Promise.all([]);
  }
}
