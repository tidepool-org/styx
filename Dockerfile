FROM node:6.10.3-alpine

# Common ENV
ENV API_SECRET="This is a local API secret for everyone. BsscSHqSHiwrBMJsEGqbvXiuIUPAjQXU" \
    SERVER_SECRET="This needs to be the same secret everywhere. YaHut75NsK1f9UKUXuWqxNN0RUwHFBCy" \
    LONGTERM_KEY="abcdefghijklmnopqrstuvwxyz" \
    DISCOVERY_HOST=hakken:8000 \
    PUBLISH_HOST=hakken \
    METRICS_SERVICE="{ \"type\": \"static\", \"hosts\": [{ \"protocol\": \"http\", \"host\": \"highwater:9191\" }] }" \
    USER_API_SERVICE="{ \"type\": \"static\", \"hosts\": [{ \"protocol\": \"http\", \"host\": \"shoreline:9107\" }] }" \
    SEAGULL_SERVICE="{ \"type\": \"static\", \"hosts\": [{ \"protocol\": \"http\", \"host\": \"seagull:9120\" }] }" \
    GATEKEEPER_SERVICE="{ \"type\": \"static\", \"hosts\": [{ \"protocol\": \"http\", \"host\": \"gatekeeper:9123\" }] }" \
# Container specific ENV
    HTTP_PORT=8009 \
    DISCOVERY="{\"host\":\"hakken:8000\"}" \
    HTTPS_PORT=8010 HTTPS_CONFIG="{\"key\":\"sslKey.pem\",\"cert\":\"sslCert.pem\"}"

WORKDIR /app

COPY package.json /app/package.json
RUN apk --no-cache add curl git \
# Get the styx rules from the `tools` repo and modify them to suit our dev container environment
# TODO - change more services?
 && curl --remote-name https://raw.githubusercontent.com/tidepool-org/tools/master/styx_rules.json \
 && sed -i -e 's/    "localhost:[0-9]*"/    "*"/' \
           -e 's/localhost:8077/dataservices:8077/g' \
           -e 's/localhost:8078/userservices:8078/g' \
           -e 's/localhost:9107/shoreline:9107/g' \
           -e 's/localhost:9119/message-api:9119/g' \
           -e 's/localhost:9120/seagull:9120/g' \
           -e 's/localhost:9122/jellyfish:9122/g' \
           -e 's/localhost:9123/gatekeeper:9123/g' \
           -e 's/localhost:9127/tide-whisperer:9127/g' \
           -e 's/localhost:9157/hydrophone:9157/g' \
           -e 's/localhost:9191/highwater:9191/g' \
           styx_rules.json \
# Also get the SSL certificates for HTTPS
 && curl --remote-name https://raw.githubusercontent.com/tidepool-org/tools/master/keys/sslCert.pem \
 && curl --remote-name https://raw.githubusercontent.com/tidepool-org/tools/master/keys/sslKey.pem \
 && yarn install \
 && apk del git curl
COPY . /app

VOLUME /app
USER node

EXPOSE 8009 8010

ENTRYPOINT RULES=`cat styx_rules.json` exec node server.js
