#!/bin/bash

# gen-xslt-json.sh
# Usage: ./gen-xslt-json.sh xslt_file [sef_output]

if [ -z "$1" ]; then
  echo "Usage: $0 <xslt-file> [sef-output]"
  exit 1
fi

XSLT_FILE="$1"

if [ -z "$2" ]; then
  SEF_OUTPUT="${XSLT_FILE%.*}.sef.json"
else
  SEF_OUTPUT="$2"
fi

xslt3 -xsl:"$XSLT_FILE" -export:"$SEF_OUTPUT" -t -relocate:on

echo "\n\nGenerated SEF JSON: $SEF_OUTPUT"