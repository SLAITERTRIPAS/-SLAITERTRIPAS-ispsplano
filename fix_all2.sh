#!/bin/bash
FILES=$(grep -rl "printElementById(\"print-area\")" src/ | grep -v "printUtils.ts")

for file in $FILES; do
  sed -i 's/id="print-area" //g' "$file"
done
