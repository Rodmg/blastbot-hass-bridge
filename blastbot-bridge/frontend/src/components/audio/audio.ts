import { SettingsProvider } from "../../providers/settings/settings";
import { Injectable } from "@angular/core";

@Injectable()
export class AudioComponent {
  stream: any;

  constructor(public SettingsProvider: SettingsProvider) {}

  initAudioWeb() {
    this.stream = new Audio("assets/sounds/click.mp3");
    this.stream.load();
  }

  playClick() {
    if (!this.SettingsProvider.getSound()) return;
    this.stream.play();
  }
}
