import { NgModule, ErrorHandler } from "@angular/core";
import { HttpModule, Http, RequestOptions } from "@angular/http";
import { HttpClientModule, HttpClient } from "@angular/common/http";
import { IonicApp, IonicModule, IonicErrorHandler } from "ionic-angular";
import { BrowserModule } from "@angular/platform-browser";
import { MyApp } from "./app.component";

import { ControlsPage } from "../pages/controls/controls";
import { ControlPage } from "../pages/control/control";
import { SwitchPage } from "../pages/switch/switch";
import { SmartControlPage } from "../pages/smart-control/smart-control";
import { DevicesPage } from "../pages/devices/devices";
import { SettingsPage } from "../pages/settings/settings";
import { SetupDevicePage } from "../pages/setup-device/setup-device";
import { SetupBlastbotPage } from "../pages/setup-blastbot/setup-blastbot";
import { SetupBlastbotPlugPage } from "../pages/setup-blastbot-plug/setup-blastbot-plug";
import { SetupBlastbotSwitchPage } from "../pages/setup-blastbot-switch/setup-blastbot-switch";
import { SetupRfSensorPage } from "../pages/setup-rf-sensor/setup-rf-sensor";
import { BlankPage } from "../pages/blank/blank";
import { ErrorPage } from "../pages/error/error";
import { ProtoPage } from "../pages/proto-page/proto-page";
import { DevicePage } from "../pages/device/device";
import { AddControlPage } from "../pages/add-control/add-control";
import { ScanControlsPage } from "../pages/scan-controls/scan-controls";
import { AddButtonPage } from "../pages/add-button/add-button";
import { HelpPage } from "../pages/help/help";
import { HelpItemPage } from "../pages/help-item/help-item";
import { LearnCodePage } from "../pages/learn-code/learn-code";
import { SelectIconPage } from "../pages/select-icon/select-icon";
import { SelectColorPage } from "../pages/select-color/select-color";
import { ControlPopoverPage } from "../pages/control-popover/control-popover";
import { EditControlPage } from "../pages/edit-control/edit-control";
import { WelcomePage } from "../pages/welcome/welcome";

import { AudioComponent } from "../components/audio/audio";
import { LocalStorage } from "../components/local-storage/local-storage";

import { Button } from "../providers/button/button";
import { Control } from "../providers/control/control";
import { Switch } from "../providers/switch/switch";
import { Device } from "../providers/device/device";
import { Resource } from "../providers/resource/resource";
import { ACSettings } from "../providers/acsettings/acsettings";
import { DBTypes } from "../providers/db-types/db-types";
import { DBBrands } from "../providers/db-brands/db-brands";
import { DBControls } from "../providers/db-controls/db-controls";
import { DBSmartControls } from "../providers/db-smartcontrols/db-smartcontrols";
import { SettingsProvider } from "../providers/settings/settings";

import { DatePipe } from "@angular/common";
import { SortablejsModule } from "angular-sortablejs";
import { ButtonViewComponent } from "../components/button-view/button-view";
import { SwitchViewComponent } from "../components/switch-view/switch-view";
import { SwitchWidgetComponent } from "../components/switch-widget/switch-widget";
import { IrWidgetComponent } from "../components/ir-widget/ir-widget";
import { ProtoWidgetComponent } from "../components/proto-widget/proto-widget";
import { ACWidgetComponent } from "../components/ac-widget/ac-widget";

import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ActionPopoverPage } from "../pages/action-popover/action-popover";

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, "assets/i18n/", ".json");
}

@NgModule({
  declarations: [
    MyApp,
    ControlsPage,
    ControlPage,
    SwitchPage,
    SmartControlPage,
    DevicesPage,
    SettingsPage,
    SetupDevicePage,
    SetupBlastbotPage,
    SetupBlastbotPlugPage,
    SetupBlastbotSwitchPage,
    SetupRfSensorPage,
    BlankPage,
    ErrorPage,
    ProtoPage,
    DevicePage,
    AddControlPage,
    ScanControlsPage,
    AddButtonPage,
    HelpPage,
    HelpItemPage,
    LearnCodePage,
    SelectIconPage,
    SelectColorPage,
    ControlPopoverPage,
    EditControlPage,
    WelcomePage,
    ButtonViewComponent,
    SwitchViewComponent,
    SwitchWidgetComponent,
    IrWidgetComponent,
    ProtoWidgetComponent,
    ACWidgetComponent,
    ActionPopoverPage,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpModule,
    HttpClientModule,
    SortablejsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    IonicModule.forRoot(MyApp, {
      platforms: {
        ios: {
          backButtonText: "Atrás",
        },
      },
      monthNames: [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ],
      monthShortNames: [
        "ene",
        "feb",
        "mar",
        "abr",
        "may",
        "jun",
        "jul",
        "ago",
        "sep",
        "oct",
        "nov",
        "dic",
      ],
      dayNames: [
        "domingo",
        "lunes",
        "martes",
        "miércoles",
        "jueves",
        "viernes",
        "sábado",
      ],
      dayShortNames: ["dom", "lun", "mar", "mie", "jue", "vie", "sab"],
    }),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    ControlsPage,
    ControlPage,
    SwitchPage,
    SmartControlPage,
    DevicesPage,
    SettingsPage,
    SetupDevicePage,
    SetupBlastbotPage,
    SetupBlastbotPlugPage,
    SetupBlastbotSwitchPage,
    SetupRfSensorPage,
    BlankPage,
    ErrorPage,
    ProtoPage,
    DevicePage,
    AddControlPage,
    ScanControlsPage,
    AddButtonPage,
    HelpPage,
    HelpItemPage,
    LearnCodePage,
    SelectIconPage,
    SelectColorPage,
    ControlPopoverPage,
    EditControlPage,
    WelcomePage,
    ButtonViewComponent,
    SwitchViewComponent,
    SwitchWidgetComponent,
    IrWidgetComponent,
    ProtoWidgetComponent,
    ACWidgetComponent,
    ActionPopoverPage,
  ],
  providers: [
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    Button,
    Control,
    Switch,
    Device,
    Resource,
    ACSettings,
    DBTypes,
    DBBrands,
    DBControls,
    DBSmartControls,
    SettingsProvider,
    AudioComponent,
    LocalStorage,
    DatePipe,
  ],
})
export class AppModule {}
