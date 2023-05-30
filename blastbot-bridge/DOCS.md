# Blastbot Bridge

## Usage

See README for installation and usage instructions.

## Development

You can run the server code stand alone with a node v18 installation. To do that, go to the `server` folder and do:

```
# Install dependencies
npm install

# Copy .env.example to .env and edit the values accordingly to your setup.
# You will need to manually create a user in Home Assistant to use as the MQTT_USER,
# and create a long-lived Home Assistant token to enable automatic user management.

cp .env.example .env

# Start the app
npm run watch
```

Frontend code is currently mantained in a sepparate repository and integrated as static pre-compiled assets in `server/public` folder.
