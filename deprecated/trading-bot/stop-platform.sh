#!/bin/bash
# Forward to the actual script in the new location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pushd "${SCRIPT_DIR}/startup/scripts" > /dev/null
./stop-platform.sh "$@"
popd > /dev/null