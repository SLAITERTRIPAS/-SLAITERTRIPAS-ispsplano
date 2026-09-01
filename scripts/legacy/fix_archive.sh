sed -i 's/<div id="print-area" /<div /g' src/blocos/bloco5_sistema/ArchiveView.tsx
perl -i -pe 'if (!$done && /return \(/) { $found = 1; } if ($found && !$done && /^(\s*)<div /) { s/<div /<div id="print-area" /; $done=1; }' src/blocos/bloco5_sistema/ArchiveView.tsx
