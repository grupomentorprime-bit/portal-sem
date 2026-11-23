#!/bin/bash
set -eu
mongosh --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --quiet <<EOF
db.getSiblingDB("nelzuri_dev").createUser({
  user: "nelzuri_dev",
  pwd: "${MONGO_APP_PASSWORD}",
  roles: [
    { role: "readWrite", db: "nelzuri_dev" }
  ]
})
EOF
