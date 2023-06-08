# Blastbot Bridge Add-on for Home Assistant

Provides a way for using all Blastbot device functionalities locally in a Home Assistant installation, without needing the cloud for day-to-day functionality.

**Please note:** On this Add-on config you can set a user and password for a Blastbot Cloud account, this is only for fetching AC and IR control codes from the Cloud catalog during the initial setup of a control. If you don't use this, you will still be able to use your devices, but you will need to manually learn each IR command (This only applies to IR and AC controls).

You can create a Blastbot Cloud account for free here: https://cloud.blastbot.io (You don't need to actually use the cloud interface, just create a blank account and use those credentials for configuring the Blastbot Bridge Add-on).

## Installation and prerequisites

This Add-on requires your Home Assitant installation to already have a properly configured MQTT Broker (recommended: Mosquitto broker official Add-on), and the MQTT integration configured to accept MQTT Discovery messages.

### Prerequisite 1: Installing a MQTT Broker

Follow these steps to get the MQTT Broker add-on installed on your system:

1. Navigate in your Home Assistant frontend to Settings -> Add-ons -> Add-on store.
2. Find the "Mosquitto broker" add-on and click it.
3. Click on the "INSTALL" button.
4. Start the add-on.
5. Have some patience and wait a couple of minutes.
6. Check the add-on log output to see if it is running correctly.

### Prerequisite 2: Enable the MQTT integration

1. Navigate in your Home Assistant frontend to Settings -> Devices and Services -> Add Integration.
2. Search for MQTT and select "MQTT",
3. Follow the configuration steps, make sure to select the default port (1883), Enable discovery, and keep the Discovery prefix as default (homeassistant).

### Installation

1. Navigate in your Home Assistant frontend to Settings -> Add-ons -> Add-on store.
2. Add this Add-on repository: https://github.com/Rodmg/blastbot-hass-bridge.git
3. Find the "Blastbot Bridge" add-on and click it.
4. Click on the "INSTALL" button.
5. Have some patience and wait, it may take up to 20 minutes to install.
6. After it finishes installing, go to the "Configuration" tab.
7. Under "External MQTT Broker Address" enter the address that a device would use to connect to your Home Assistant in a local network, it is usually the ip address of your Home Assistant device. Enter the plain address or domain name.
8. Under "Blastbot Cloud API User" and "Blastbot Cloud API Password", enter your Blastbot Cloud credentials. You can create a new blank account in https://cloud.blastbot.io if needed.
9. Click the "SAVE" button.
10. Go to the main info tab and enable "Watchdog" and "Show in sidebar".
11. Start the add-on.

Now you can open the Blastbot Config interface from the sidebar and start configuring your devices. The devicess will appear automatically as devices and entities in Home Assistant.
