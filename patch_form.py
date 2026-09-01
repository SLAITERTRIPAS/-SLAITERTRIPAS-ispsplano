import re

with open('src/blocos/bloco8_gerais/RegistarFuncionarioForm.tsx', 'r') as f:
    content = f.read()

# Modify handleUnidadeChange etc. to accept HTMLInputElement
content = content.replace(
    'const handleUnidadeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {',
    'const handleUnidadeChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {'
)
content = content.replace(
    'const handleDirecaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {',
    'const handleDirecaoChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {'
)
content = content.replace(
    'const handleDepartamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {',
    'const handleDepartamentoChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {'
)
content = content.replace(
    'const handleReparticaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {',
    'const handleReparticaoChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {'
)
content = content.replace(
    'const handleProvinciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {',
    'const handleProvinciaChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {'
)

# And do not reset other fields when typing, only update the value itself!
# Otherwise typing "I" in unidade will clear "direcao" immediately.
# Let's remove the clear logic from these handlers.
content = re.sub(
    r'const handleUnidadeChange = \(e: React\.ChangeEvent<HTMLSelectElement \| HTMLInputElement>\) => \{.*?\setUnidade\(e\.target\.value\);.*?\};',
    '''const handleUnidadeChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setUnidade(e.target.value);
  };''',
    content, flags=re.DOTALL
)
content = re.sub(
    r'const handleDirecaoChange = \(e: React\.ChangeEvent<HTMLSelectElement \| HTMLInputElement>\) => \{.*?\setDirecao\(e\.target\.value\);.*?\};',
    '''const handleDirecaoChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setDirecao(e.target.value);
  };''',
    content, flags=re.DOTALL
)
content = re.sub(
    r'const handleDepartamentoChange = \(e: React\.ChangeEvent<HTMLSelectElement \| HTMLInputElement>\) => \{.*?\setDepartamento\(e\.target\.value\);.*?\};',
    '''const handleDepartamentoChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setDepartamento(e.target.value);
  };''',
    content, flags=re.DOTALL
)
content = re.sub(
    r'const handleReparticaoChange = \(e: React\.ChangeEvent<HTMLSelectElement \| HTMLInputElement>\) => \{.*?\setReparticao\(e\.target\.value\);.*?\};',
    '''const handleReparticaoChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setReparticao(e.target.value);
  };''',
    content, flags=re.DOTALL
)
content = re.sub(
    r'const handleProvinciaChange = \(e: React\.ChangeEvent<HTMLSelectElement \| HTMLInputElement>\) => \{.*?\setProvincia\(e\.target\.value\);.*?\};',
    '''const handleProvinciaChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setProvincia(e.target.value);
  };''',
    content, flags=re.DOTALL
)

# Now replace the <select> tags in the render method with <input list="...">
def replace_select(content, var_name, datalist_id, map_code):
    pattern = r'<select\s+className="([^"]+)"\s+value=\{' + var_name + r'\}\s+onChange=\{([^}]+)\}(.*?)(?:disabled=\{([^}]+)\})?\s*>\s*<option[^>]*>.*?</option>\s*\{' + map_code + r'\s*\}\s*</select>'
    
    def repl(m):
        class_name = m.group(1)
        on_change = m.group(2)
        disabled_attr = f' disabled={{{m.group(4)}}}' if m.group(4) else ''
        
        return f'''<input 
              type="text"
              list="{datalist_id}"
              className="{class_name}"
              value={{{var_name}}}
              onChange={{{on_change}}}{disabled_attr}
              placeholder="Selecione ou digite..."
            />
            <datalist id="{datalist_id}">
              {{{map_code}}}
            </datalist>'''
    
    return re.sub(pattern, repl, content, flags=re.DOTALL)

content = replace_select(content, "provincia", "provincia-list", r'Object\.keys\(PROVINCIAS_DISTRITOS\)\.map\(p => \(\s*<option key=\{p\} value=\{p\}>\{p\}</option>\s*\)\)')
content = replace_select(content, "distrito", "distrito-list", r'provincia && PROVINCIAS_DISTRITOS\[provincia\]\?\.map\(d => \(\s*<option key=\{d\} value=\{d\}>\{d\}</option>\s*\)\)')
content = replace_select(content, "unidade", "unidade-list", r'UNIDADES_ORGANICAS_SISTEMA\.map\(u => \(\s*<option key=\{u\.nome\} value=\{u\.nome\}>\{u\.nome\}</option>\s*\)\)')
content = replace_select(content, "direcao", "direcao-list", r'unidade && UNIDADES_ORGANICAS_SISTEMA\.find\(u => u\.nome === unidade\)\?\.direcoes\.map\(d => \(\s*<option key=\{d\} value=\{d\}>\{d\}</option>\s*\)\)')
content = replace_select(content, "departamento", "departamento-list", r'direcao && \(DEPARTAMENTOS_CORRETOS\[direcao as keyof typeof DEPARTAMENTOS_CORRETOS\] \|\| DEPARTAMENTOS\[direcao as keyof typeof DEPARTAMENTOS\]\)\?\.map\(d => \(\s*<option key=\{d\} value=\{d\}>\{d\}</option>\s*\)\)')
content = replace_select(content, "reparticao", "reparticao-list", r'departamento && REPARTICOES\[departamento as keyof typeof REPARTICOES\]\?\.map\(r => \(\s*<option key=\{r\} value=\{r\}>\{r\}</option>\s*\)\)')
content = replace_select(content, "sector", "sector-list", r'reparticao && SECTORES\[reparticao\]\?\.map\(s => \(\s*<option key=\{s\} value=\{s\}>\{s\}</option>\s*\)\)')
content = replace_select(content, "curso", "curso-list", r'CURSOS\[departamento\]\?\.map\(c => \(\s*<option key=\{c\} value=\{c\}>\{c\}</option>\s*\)\)')


# Also replace the 4 cursos
# Wait, for the 4 cursos, it's inside a map:
curso_map_pattern = r'<select\s+className="([^"]+)"\s+value=\{cursos\[idx\]\}\s+onChange=\{\(e\) => \{.*?\setCursos\(newCursos\);\s*if \(idx === 0\) setCurso\(e\.target\.value\);\s*\}\}\s*>\s*<option[^>]*>.*?</option>\s*\{CURSOS\[departamento\]\?\.map\(c => \(\s*<option key=\{c\} value=\{c\}>\{c\}</option>\s*\)\)\}\s*</select>'
def repl_curso_map(m):
    return f'''<input type="text" list={{`curso-list-${{idx}}`}} className="{m.group(1)}" value={{cursos[idx]}} onChange={{(e) => {{
                        const newCursos = [...cursos];
                        newCursos[idx] = e.target.value;
                        setCursos(newCursos);
                        if (idx === 0) setCurso(e.target.value);
                      }}}} placeholder={{`Selecione ou digite Curso ${{idx + 1}}...`}} />
                    <datalist id={{`curso-list-${{idx}}`}}>
                      {{CURSOS[departamento]?.map(c => (
                        <option key={{c}} value={{c}}>{{c}}</option>
                      ))}}
                    </datalist>'''
content = re.sub(curso_map_pattern, repl_curso_map, content, flags=re.DOTALL)

with open('src/blocos/bloco8_gerais/RegistarFuncionarioForm.tsx', 'w') as f:
    f.write(content)

print("Patch RegistarFuncionarioForm applied.")
