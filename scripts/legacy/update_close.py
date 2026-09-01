import re

with open('src/blocos/bloco5_sistema/ActivityForm.tsx', 'r') as f:
    content = f.read()

target = r'''                    \{formData\.rubricas\.length > 1 && \('''
replacement = '''                    </div>
                    {formData.rubricas.length > 1 && ('''

content = re.sub(target, replacement, content)

with open('src/blocos/bloco5_sistema/ActivityForm.tsx', 'w') as f:
    f.write(content)
