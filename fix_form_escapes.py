import re

with open('src/blocos/bloco8_gerais/RegistarFuncionarioForm.tsx', 'r') as f:
    content = f.read()

# Fix the regex escapes that were inserted as literal text
content = content.replace(r'{Object\.keys\(PROVINCIAS_DISTRITOS\)\.map\(p => \(\s*<option key=\{p\} value=\{p\}>\{p\}</option>\s*\)\)}',
    '''{Object.keys(PROVINCIAS_DISTRITOS).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}''')
content = content.replace(r'{provincia && PROVINCIAS_DISTRITOS\[provincia\]\?\.map\(d => \(\s*<option key=\{d\} value=\{d\}>\{d\}</option>\s*\)\)}',
    '''{provincia && PROVINCIAS_DISTRITOS[provincia]?.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}''')

content = content.replace(r'{UNIDADES_ORGANICAS_SISTEMA\.map\(u => \(\s*<option key=\{u\.nome\} value=\{u\.nome\}>\{u\.nome\}</option>\s*\)\)}',
    '''{UNIDADES_ORGANICAS_SISTEMA.map(u => (
                <option key={u.nome} value={u.nome}>{u.nome}</option>
              ))}''')

content = content.replace(r'{unidade && UNIDADES_ORGANICAS_SISTEMA\.find\(u => u\.nome === unidade\)\?\.direcoes\.map\(d => \(\s*<option key=\{d\} value=\{d\}>\{d\}</option>\s*\)\)}',
    '''{unidade && UNIDADES_ORGANICAS_SISTEMA.find(u => u.nome === unidade)?.direcoes.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}''')

content = content.replace(r'{\(DEPARTAMENTOS_CORRETOS\[direcao as keyof typeof DEPARTAMENTOS_CORRETOS\] \|\| DEPARTAMENTOS\[direcao as keyof typeof DEPARTAMENTOS\]\)\?\.map\(d => \(\s*<option key=\{d\} value=\{d\}>\{d\}</option>\s*\)\)}',
    '''{(DEPARTAMENTOS_CORRETOS[direcao as keyof typeof DEPARTAMENTOS_CORRETOS] || DEPARTAMENTOS[direcao as keyof typeof DEPARTAMENTOS])?.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}''')

content = content.replace(r'{departamento && REPARTICOES\[departamento as keyof typeof REPARTICOES\]\?\.map\(r => \(\s*<option key=\{r\} value=\{r\}>\{r\}</option>\s*\)\)}',
    '''{departamento && REPARTICOES[departamento as keyof typeof REPARTICOES]?.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}''')

content = content.replace(r'{reparticao && SECTORES\[reparticao\]\?\.map\(s => \(\s*<option key=\{s\} value=\{s\}>\{s\}</option>\s*\)\)}',
    '''{reparticao && SECTORES[reparticao]?.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}''')
                  
# Fix the disabled={} syntax issue that happened because of the regex missing a brace
content = content.replace(r'onChange={(e) => setDistrito(e.target.value)} disabled={!provincia}', r'onChange={(e) => setDistrito(e.target.value)} disabled={!provincia}') # this is actually fine, just missing newline maybe? Wait, no, it's correct syntax in JSX.

content = content.replace(r'onChange={handleDirecaoChange} disabled={!unidade}', r'onChange={handleDirecaoChange} disabled={!unidade}')
content = content.replace(r'onChange={handleDepartamentoChange} disabled={!direcao || !(DEPARTAMENTOS_CORRETOS[direcao as keyof typeof DEPARTAMENTOS_CORRETOS] || DEPARTAMENTOS[direcao as keyof typeof DEPARTAMENTOS])}', r'onChange={handleDepartamentoChange} disabled={!direcao || !(DEPARTAMENTOS_CORRETOS[direcao as keyof typeof DEPARTAMENTOS_CORRETOS] || DEPARTAMENTOS[direcao as keyof typeof DEPARTAMENTOS])}')

with open('src/blocos/bloco8_gerais/RegistarFuncionarioForm.tsx', 'w') as f:
    f.write(content)

print("Patch RegistarFuncionarioForm escapes applied.")
