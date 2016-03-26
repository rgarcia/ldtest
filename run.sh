#!/usr/bin/env bash
set -e

npm install --production
cp index_override.js node_modules/ldclient-node/index.js
cp eventsource_override.js node_modules/ldclient-node/eventsource.js
node test.js
