ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Jaime Alarm Client
WORKDIR /srv/app/
COPY server /srv/app/
RUN \
  set -x \
  && apk add --no-cache \
  nodejs \
  npm \
  && apk add --no-cache --virtual .build-dependencies \
  build-base \
  git \
  linux-headers \
  python3 \
  \
  && npm install --python=/usr/bin/python3 \
  && npm run build \
  && apk del --no-cache \
  .build-dependencies

WORKDIR /
COPY run.sh /
RUN chmod a+x /run.sh

CMD ["/run.sh"]