import { jstz } from "../../components/jstz/jstz";
import * as moment from "moment";
import { TranslateService } from "@ngx-translate/core";
import { SettingsProvider } from "../../providers/settings/settings";

export const colors: Array<string> = [
  "red",
  "purple",
  "blue",
  "light-blue",
  "orange",
  "green",
  "brown",
  "pink",
];

export const months = [
  { name: "january", val: 1 },
  { name: "february", val: 2 },
  { name: "march", val: 3 },
  { name: "april", val: 4 },
  { name: "may", val: 5 },
  { name: "june", val: 6 },
  { name: "july", val: 7 },
  { name: "august", val: 8 },
  { name: "september", val: 9 },
  { name: "october", val: 10 },
  { name: "november", val: 11 },
  { name: "december", val: 12 },
];

export const taskTypes = [
  { val: "hourly" },
  { val: "daily" },
  { val: "weekly" },
  { val: "monthly" },
  { val: "yearly" },
  { val: "once" },
];

export const validityTypes = [
  { val: "always" },
  { val: "daily" },
  { val: "weekly" },
  // { val: 'monthly' },
  { val: "specific" },
];

export const weekdays = [
  { name: "sunday", val: 0 },
  { name: "monday", val: 1 },
  { name: "tuesday", val: 2 },
  { name: "wednesday", val: 3 },
  { name: "thursday", val: 4 },
  { name: "friday", val: 5 },
  { name: "saturday", val: 6 },
];

export const icons = [
  "bb-ac",
  "bb-adjust",
  "bb-airplay",
  "bb-alarm",
  "bb-alarm-on",
  "bb-aspect-ratio",
  "bb-audio",
  "bb-back",
  "bb-blastbot",
  "bb-blastbot-outline",
  "bb-calendar",
  "bb-cancel",
  "bb-cancel-circle",
  "bb-cc",
  "bb-chan-down",
  "bb-chan-up",
  "bb-clock",
  "bb-dashboard",
  "bb-disc",
  "bb-disconnected",
  "bb-down",
  "bb-dvr",
  "bb-dvr-letters",
  "bb-eject",
  "bb-enter",
  "bb-fan",
  "bb-favorite",
  "bb-ff",
  "bb-flag",
  "bb-forward-10",
  "bb-forward-30",
  "bb-forward-5",
  "bb-fridge",
  "bb-games",
  "bb-history",
  "bb-home",
  "bb-info",
  "bb-input",
  "bb-input-antenna",
  "bb-input-composite",
  "bb-input-hdmi",
  "bb-input-power",
  "bb-input-svideo",
  "bb-language",
  "bb-left",
  "bb-light-off",
  "bb-light-on",
  "bb-list",
  "bb-media-box",
  "bb-menu",
  "bb-movie",
  "bb-music",
  "bb-mute",
  "bb-next",
  "bb-off",
  "bb-on",
  "bb-overscan",
  "bb-pause",
  "bb-play",
  "bb-play-pause",
  "bb-plug",
  "bb-prev",
  "bb-projector",
  "bb-rec",
  "bb-remote",
  "bb-repeat",
  "bb-replay",
  "bb-reply",
  "bb-right",
  "bb-rw",
  "bb-speaker",
  "bb-star",
  "bb-stereo",
  "bb-stop",
  "bb-timer",
  "bb-toggle",
  "bb-touch",
  "bb-tv",
  "bb-up",
  "bb-vcr",
  "bb-videogame",
  "bb-vol-down",
  "bb-vol-up",
  "bb-bar",
  "bb-building",
  "bb-camera",
  "bb-city",
  "bb-cloud",
  "bb-cloudy-night",
  "bb-coffee",
  "bb-color",
  "bb-dinner",
  "bb-extension",
  "bb-film",
  "bb-fitness",
  "bb-garden",
  "bb-hottub",
  "bb-key",
  "bb-laundry",
  "bb-library",
  "bb-location",
  "bb-lock-closed",
  "bb-lock-open",
  "bb-moon",
  "bb-outlet",
  "bb-partlysunny",
  "bb-pets",
  "bb-plane",
  "bb-radio",
  "bb-rainy",
  "bb-router",
  "bb-school",
  "bb-seat",
  "bb-sleep",
  "bb-sofa",
  "bb-speedometer",
  "bb-store",
  "bb-sun",
  "bb-thermometer",
  "bb-thumb-down",
  "bb-thumb-up",
  "bb-thunderstorm",
  "bb-today",
  "bb-umbrella",
  "bb-videocam",
  "bb-warning",
  "bb-wc",
  "bb-work",
];

export function getRandomColor() {
  let index = Math.floor(Math.random() * colors.length);
  return colors[index];
}

export function numberFixedLen(n: any, len: number) {
  return (1e4 + "" + n).slice(-len);
}

export function numToMonth(n: number) {
  return months[n - 1].name;
}

export function getTimezones() {
  let timezones = [];
  for (let i in jstz.olson.timezones) {
    if (timezones.indexOf(jstz.olson.timezones[i]) === -1)
      timezones.push(jstz.olson.timezones[i]);
  }
  timezones.push("America/Merida");
  timezones.push("America/Cancun");
  timezones.push("America/Mexico_City");
  timezones = timezones.sort();
  return timezones;
}

export function generateNArray(from, to) {
  let arr = [];
  for (let i = from; i <= to; i++) {
    arr.push(i);
  }
  return arr;
}

export function roundMinutes(time: Date, allowedMinutes: Array<number>): Date {
  // Remove any seconds
  time.setSeconds(0, 0);
  let minutes = time.getMinutes();
  let difference = 0; //(ms)
  if (allowedMinutes.indexOf(minutes) === -1) {
    for (let i = allowedMinutes.length - 1; i >= 0; i--) {
      if (minutes > allowedMinutes[i]) {
        if (allowedMinutes.length === i + 1) difference = 60 - minutes;
        else difference = allowedMinutes[i + 1] - minutes;
        break;
      }
    }
  }

  let timeMoment = moment(time);
  timeMoment.add(difference, "minutes");
  time = timeMoment.toDate();

  return time;
}

export function goBuyBlastbot(settings: SettingsProvider) {
  const profile = settings.getProfile();
  const store_blastbot = "https://blastbot.io/";
  const store_brazil = "https://www.Easy4Home.com/";
  const url = profile.locale != "pt" ? store_blastbot : store_brazil;

  window.open(url, "_system");
}

export function describeAction(action: any, translate: TranslateService) {
  let description;
  try {
    if (action.type === "ir") {
      description = action.irbutton.control.name + ": " + action.irbutton.name;
    } else if (action.type === "ac") {
      description =
        action.acsettings.control.name + ": " + action.payload.command;
    } else if (action.type === "switch") {
      description = action.switch.control.name + ": " + action.payload.command;
    } else if (action.type === "scene") {
      description = translate.instant("scene.scene") + ": " + action.scene.name;
    }
    return description;
  } catch (err) {
    return "";
  }
}

export function mapSharedControl(control) {
  control.isShared = false;
  if (control.type === "shared") {
    control.isShared = true;
    let sharedItem = control.sharedControl;
    delete control.sharedControl;
    control.type = sharedItem.type;
    control.name = sharedItem.name;
    control.icon = sharedItem.icon;
    if (sharedItem.acSettings) control.acSettings = sharedItem.acSettings;
    if (sharedItem.buttons) control.buttons = sharedItem.buttons;
    if (sharedItem.switches) control.switches = sharedItem.switches;
    if (sharedItem.device) control.device = sharedItem.device;
    if (sharedItem.origin) control.origin = sharedItem.origin;
  }
  return control;
}

export const RESTORE_DEVICE_SETUP_KEY = "deviceSetupInProgress";
