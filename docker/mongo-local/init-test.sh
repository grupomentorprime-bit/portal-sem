#!/bin/bash
set -eu
mongosh --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --quiet <<EOF
db.getSiblingDB("admin").createRole({
  role: "nelzuriFixtureMinted",
  privileges: [
    {
      resource: { db: "", collection: "" },
      actions: [
        "find",
        "insert",
        "update",
        "remove",
        "createCollection",
        "createIndex",
        "dropIndex",
        "dropCollection",
        "dropDatabase",
        "listCollections",
        "listIndexes",
        "killCursors"
      ]
    }
  ],
  roles: []
})
db.getSiblingDB("nelzuri_fixture").createUser({
  user: "nelzuri_fixture",
  pwd: "${MONGO_APP_PASSWORD}",
  roles: [
    { role: "readWrite", db: "nelzuri_fixture" },
    { role: "nelzuriFixtureMinted", db: "admin" }
  ]
})
EOF
