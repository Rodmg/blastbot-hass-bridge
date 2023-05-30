#!/usr/bin/with-contenv bashio
set -e

export SERVER_PORT='5555'

# Blank urls means use frontend root by default
export URLS_PROTOCOL=''
export URLS_URL=''
export URLS_PORT=''
export URLS_API_ROOT='api/v3'

export DB_TYPE='sqlite'
export DB_NAME='blastbotbridge'
export DB_STORAGE='/data/blastbotbridge.sqlite'

if bashio::services.available "mqtt"; then
    export MQTT_USER=$(bashio::services "mqtt" "username")
    export MQTT_PASSWORD=$(bashio::services "mqtt" "password")
    export MQTT_ADDRESS=$(bashio::config 'external_mqtt_broker_address')
    MQTT_INTERNAL_ADDRESS=$(bashio::services "mqtt" "host")
    MQTT_PORT=$(bashio::services "mqtt" "port")
    export MQTT_URI="mqtt://$MQTT_INTERNAL_ADDRESS:$MQTT_PORT"
else
    echo 'WARNING: No mqtt service available, devices won'\''t be able to connect'
    export MQTT_USER='none'
    export MQTT_PASSWORD='none'
    export MQTT_ADDRESS='none'
    export MQTT_URI='mqtt://localhost:1880'
fi

export BB_CLOUD_URL=$(bashio::config 'blastbot_cloud_url')
export BB_CLOUD_API_USER=$(bashio::config 'blastbot_cloud_api_user')
export BB_CLOUD_API_PASSWORD=$(bashio::config 'blastbot_cloud_api_password')

export HASS_BASE_URL='http://supervisor/core'
export HASS_API_TOKEN="${SUPERVISOR_TOKEN:-}"

cd /srv/app
npm start