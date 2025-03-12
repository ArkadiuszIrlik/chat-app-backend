#!/bin/bash
# Authenticates Infisical on container start
export INFISICAL_TOKEN=$(infisical login --method=universal-auth --client-id=$(< /run/secrets/infisicalClientId) --client-secret=$(< /run/secrets/infisicalClientSecret)  --domain $INFISICAL_API_URL --plain --silent)
exec infisical run --token $INFISICAL_TOKEN --projectId $INFISICAL_PROJECT_ID --env $INFISICAL_SECRET_ENV --domain $INFISICAL_API_URL -- "$@"
