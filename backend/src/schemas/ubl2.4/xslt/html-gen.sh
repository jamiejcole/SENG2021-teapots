#!/bin/bash

# html-gen.sh
# Usage: ./html-gen.sh xslt_file [output_file] [source_xml]

# required XSLT file
if [ -z "$1" ]; then
  echo "Usage: $0 <xslt-file> [output-file] [source-xml]"
  exit 1
fi

XSLT_FILE="$1"

# Default output file: same path as XSLT but with .out.html
if [ -z "$2" ]; then
  OUTPUT_FILE="${XSLT_FILE%.*}.out.html"
else
  OUTPUT_FILE="$2"
fi

# Default source XML: same directory as XSLT, file named test-invoice.xml
if [ -z "$3" ]; then
  SOURCE_XML="$(dirname "$XSLT_FILE")/test-invoice.xml"
else
  SOURCE_XML="$3"
fi

# Search for Saxon JAR under ../../dev/ relative to current script
SAXON_JAR=$(find "$(dirname "$0")/../../../../dev" -name "saxon-he-12.9.jar" | head -n 1)

if [ -z "$SAXON_JAR" ]; then
  echo "Error: Saxon JAR not found under ../../dev/"
  exit 1
fi

# Check that files exist
if [ ! -f "$XSLT_FILE" ]; then
  echo "Error: XSLT file '$XSLT_FILE' does not exist."
  exit 1
fi

if [ ! -f "$SOURCE_XML" ]; then
  echo "Error: Source XML file '$SOURCE_XML' does not exist."
  exit 1
fi

# Run Saxon
java -jar "$SAXON_JAR" -s:"$SOURCE_XML" -xsl:"$XSLT_FILE" -o:"$OUTPUT_FILE"

echo "Transformation complete! Output: $OUTPUT_FILE"