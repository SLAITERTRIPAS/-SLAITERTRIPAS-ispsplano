#!/bin/bash
FILES=$(grep -rl "printElementById(\"print-area\")" src/ | grep -v "printUtils.ts")

for file in $FILES; do
  # Remove all id="print-area" from the file
  sed -i 's/id="print-area" //g' "$file"
  
  # Inject it properly:
  # We will just inject it into the very first `<div` that comes after the main `return (`.
  # This is usually indented by exactly 4 spaces (or 2).
  perl -0777 -i -pe 's/return \(\s*<div/return (\n      <div id="print-area"/s' "$file"
  perl -0777 -i -pe 's/return \(\s*<main/return (\n      <main id="print-area"/s' "$file"
done
