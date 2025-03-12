#!/bin/bash
# Authenticates Infisical on container start
export INFISICAL_TOKEN=$(infisical login --method=universal-auth --client-id=$(< /run/secrets/infisicalClientId) --client-secret=$(< /run/secrets/infisicalClientSecret)  --domain https://eu.infisical.com --plain --silent)
exec "$@"
