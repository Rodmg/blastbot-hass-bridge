export interface MQTTDiscoveryDevice {
  configuration_url?: string;
  identifiers: string[];
  manufacturer: string;
  model: string;
  name: string;
  sw_version: string;
}

export interface MQTTBaseDiscoveryPayload {
  availability_topic: string; // payload must be "offline" or "online"
  name: string;
  unique_id: string;
  object_id: string;
  device: MQTTDiscoveryDevice;
}

export interface MQTTSensorDiscoveryPayload extends MQTTBaseDiscoveryPayload {
  state_topic: string;
  state_class: string;
  unit_of_measurement: string;
  device_class: string;
}

export interface MQTTSwitchDiscoveryPayload extends MQTTBaseDiscoveryPayload {
  command_topic: string;
  state_topic: string;
}

export interface MQTTClimateDiscoveryPayload extends MQTTBaseDiscoveryPayload {
  current_temperature_topic: string;
  temperature_command_topic: string;
  temperature_state_topic: string;
  mode_command_topic: string;
  mode_state_topic: string;
  modes: ("auto" | "off" | "cool" | "heat" | "dry" | "fan_only")[];
  fan_mode_command_topic: string;
  fan_mode_state_topic: string;
  fan_modes: ("auto" | "low" | "medium" | "high")[];
  initial: number; // Initial target temperature
  max_temp: number;
  min_temp: number;
  precision: number; // should be 1.0
  temperature_unit: "C" | "F";
}

export interface DiscoveryData {
  component: string;
  objectId: string;
  payload: MQTTBaseDiscoveryPayload;
}
