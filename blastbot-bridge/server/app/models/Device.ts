import {
  Table,
  Column,
  DataType,
  BelongsTo,
  BeforeBulkDestroy,
  BeforeDestroy,
  BeforeBulkCreate,
  BeforeCreate,
  AfterCreate,
  ForeignKey,
} from "sequelize-typescript";
import { Op } from "sequelize";
import { BaseModel } from "@/libraries/BaseModel";
import { Control } from "./Control";
import crypto from "crypto";
import base64url from "base64-url";
import ShortUuid from "short-uuid";
const shortUuid = ShortUuid();

@Table({
  tableName: "device",
})
export class Device extends BaseModel<Device> {
  @Column({
    type: DataType.ENUM(
      "blastbot-ir",
      "blastbot-hub",
      "blastbot-plug",
      "blastbot-switch",
      "blastbot-switch-1",
      "blastbot-switch-3",
      "virtual-pir",
      "virtual-door",
      "virtual-button",
    ),
    allowNull: false,
    defaultValue: "blastbot-ir",
  })
  type:
    | "blastbot-ir"
    | "blastbot-hub"
    | "blastbot-plug"
    | "blastbot-switch"
    | "blastbot-switch-1"
    | "blastbot-switch-3"
    | "virtual-pir"
    | "virtual-door"
    | "virtual-button";

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "Nuevo Blastbot",
  })
  name: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  connected: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "undefined",
  })
  token: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
    defaultValue: "undefined",
  })
  udid: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  mac?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  version?: string;

  @Column({
    type: DataType.ENUM("connected", "disconnected", "lost"),
    allowNull: false,
    defaultValue: "disconnected",
  })
  state: "connected" | "disconnected" | "lost";

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastSeen?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  loggedAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  expiredAt?: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  duration?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  address?: number;

  // For KISSNet config and others
  @Column({
    type: DataType.TEXT, // JSON
    allowNull: true,
    defaultValue: null,
  })
  config?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  information?: string;

  @ForeignKey(() => Device)
  @Column({ type: DataType.INTEGER })
  bridgeId: number;

  @BelongsTo(() => Device, { hooks: true })
  bridge: Device;

  generateUdid(): Promise<string> {
    this.udid = shortUuid.new();
    return Promise.resolve(this.udid);
  }

  generateToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);
        this.token = base64url.encode(buf);
        return resolve(this.token);
      });
    });
  }

  initVirtualDevices(): Promise<boolean> {
    if (
      this.type === "virtual-pir" ||
      this.type === "virtual-door" ||
      this.type === "virtual-button"
    ) {
      this.loggedAt = new Date();
      this.state = "connected";
      this.connected = true;
    }
    return Promise.resolve(true);
  }

  generatePirDefaultConfig(): Promise<boolean> {
    if (this.type === "virtual-pir" && this.bridgeId != null) {
      // Check if not already valid config
      try {
        const parsedConfig = JSON.parse(this.config);
        if (
          parsedConfig.noPresenceDelay != null &&
          parsedConfig.presence != null
        )
          return Promise.resolve(true);
      } catch (err) {
        // Ignore
      }
      const defConfig: any = {
        presenceDelay: 0,
        noPresenceDelay: 600, // 10 minutes
        presence: false,
        lastPresence: null,
      };
      try {
        this.config = JSON.stringify(defConfig);
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }
    return Promise.resolve(false); // Not applies
  }

  assignKNAddr(): Promise<any> {
    if (
      (this.type === "blastbot-switch" ||
        this.type === "blastbot-switch-1" ||
        this.type === "blastbot-switch-3") &&
      this.bridgeId != null
    ) {
      return this.getNextKNAddr().then((addr: number) => {
        this.address = addr;
        return this.address;
      });
    }
    return Promise.resolve(false); // Not applies
  }

  getNextKNAddr(): Promise<number> {
    return Promise.resolve(
      Device.findAll({
        where: {
          bridgeId: this.bridgeId,
          [Op.or]: [
            { type: "blastbot-switch" },
            { type: "blastbot-switch-1" },
            { type: "blastbot-switch-3" },
          ],
        },
        order: [["address", "ASC"]],
      }).then((found) => {
        const foundAddrs = found.map((item) => {
          return parseInt(item.address as any);
        });
        let nextIndex = null;

        // Special case when there are no previous devices registered
        if (foundAddrs.length === 0) return 1;

        // Find lower unused address
        for (let i = 0; i < foundAddrs.length; i++) {
          const current = foundAddrs[i];
          let prev = 0;
          if (i != 0) prev = foundAddrs[i - 1];
          if (current > prev + 1) {
            // Found discontinuity, return next value inside discontinuity
            nextIndex = prev + 1;
            return nextIndex;
          }
        }
        // If we reached here, there is no discontinuity, return next value if available
        nextIndex = foundAddrs[foundAddrs.length - 1] + 1;
        // Forbidden addresses. 0xFE is the hub.
        if (nextIndex >= 0xfe) return null;
        return nextIndex;
      }),
    );
  }

  needsBridge(): boolean {
    return (
      this.type === "blastbot-switch" ||
      this.type === "blastbot-switch-1" ||
      this.type === "blastbot-switch-3"
    );
  }

  hasRf(): boolean {
    return this.type === "blastbot-hub";
  }

  toJSON() {
    const object: any = super.toJSON();
    delete object.createdAt;
    delete object.updatedAt;
    return object;
  }

  static filter(scope): any {
    const filter: any = {
      model: Device,
      required: false,
    };

    if (scope === "bridge") {
      filter.as = "bridge";
    }
    return filter;
  }
  @BeforeBulkCreate
  static beforeBulkCreateHook(items: Array<Device>, options: any) {
    if (options != null) options.individualHooks = true;
  }

  @BeforeCreate
  static beforeCreateHook(device: Device, _options: any) {
    return Promise.all([
      device.generateUdid(),
      device.generateToken(),
      device.assignKNAddr(),
      device.generatePirDefaultConfig(),
      device.initVirtualDevices(),
    ]);
  }

  @AfterCreate
  static afterCreateHook(_device: Device, _options: any) {
    // if(device.type === 'blastbot-switch') {
    //   // Send pair command to hub
    //   KissNetService.sendPair(device.id);
    // }
  }

  @BeforeBulkDestroy
  static beforeBulkDestroyHook(options: any) {
    if (options != null) options.individualHooks = true;
  }

  @BeforeDestroy
  static beforeDestroyHook(device: Device) {
    return Promise.all([
      Control.destroy({ where: { deviceId: device.id } }),
      Device.destroy({ where: { bridgeId: device.id } }),
    ]);
  }
}
