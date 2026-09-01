#!/bin/bash
FILES=$(grep -rl "printElementById(\"print-area\")" src/ | grep -v "printUtils.ts")

for file in $FILES; do
  echo "Injecting into $file"
  # Find the line number of the main return statement (usually the first `return (` after the component declaration)
  # A simpler approach: Find the first `<div className="` that appears after the component's `return (` and inject id="print-area".
  # Actually, let's just find the first occurrence of `<div ` after the last `return (` or something.
  # Or we can just use perl to inject id="print-area" into the first <div that is indented by 4 spaces (usually the main return).
  
  perl -i -pe 'if (!$done && /^(\s{2,4})<div /) { s/<div /<div id="print-area" /; $done=1; }' "$file"
done
