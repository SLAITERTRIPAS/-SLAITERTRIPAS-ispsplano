import re

with open('src/blocos/bloco5_sistema/ActivityForm.tsx', 'r') as f:
    content = f.read()

target = r'''                  <option value="">Selecione\.\.\.</option>
                  \{UNIDADES_ORGANICAS_SISTEMA\.map\(u => <option key=\{u\.id\} value=\{u\.nome\}>\{u\.nome\}</option>\)\}'''

replacement = '''                  <option value="">Selecione...</option>
                  {UNIDADES_ORGANICAS_SISTEMA.map(u => {
                    let abbrev = '';
                    if (u.id === 'odg') abbrev = 'ODG - ';
                    if (u.id === 'uo') abbrev = 'UO - ';
                    if (u.id === 'sc') abbrev = 'SC - ';
                    return <option key={u.id} value={u.nome}>{abbrev}{u.nome}</option>;
                  })}'''

content = re.sub(target, replacement, content)

with open('src/blocos/bloco5_sistema/ActivityForm.tsx', 'w') as f:
    f.write(content)
