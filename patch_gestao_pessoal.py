import re

with open('src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx', 'r') as f:
    content = f.read()

# Remove the clears from onChange
content = content.replace(
    'onChange={(e) => setSelectedColaborador({ ...selectedColaborador, unidade: e.target.value, direcao: "", departamento: "", reparticao: "", curso: "" })}',
    'onChange={(e) => setSelectedColaborador({ ...selectedColaborador, unidade: e.target.value })}'
)
content = content.replace(
    'onChange={(e) => setSelectedColaborador({ ...selectedColaborador, direcao: e.target.value, departamento: "", reparticao: "", curso: "" })}',
    'onChange={(e) => setSelectedColaborador({ ...selectedColaborador, direcao: e.target.value })}'
)
content = content.replace(
    'onChange={(e) => setSelectedColaborador({ ...selectedColaborador, departamento: e.target.value, reparticao: "", curso: "" })}',
    'onChange={(e) => setSelectedColaborador({ ...selectedColaborador, departamento: e.target.value })}'
)
content = content.replace(
    'onChange={(e) => setSelectedColaborador({ ...selectedColaborador, reparticao: e.target.value, curso: "" })}',
    'onChange={(e) => setSelectedColaborador({ ...selectedColaborador, reparticao: e.target.value })}'
)
content = content.replace(
    'onChange={(e) => setSelectedColaborador({ ...selectedColaborador, quarteirao: e.target.value, quarteiraoNo: e.target.value })}',
    'onChange={(e) => setSelectedColaborador({ ...selectedColaborador, quarteirao: e.target.value })}'
)

def replace_select(content, var_name, datalist_id, map_code, obj_prop):
    pattern = r'<select\s+className="([^"]+)"\s+value=\{selectedColaborador\.' + obj_prop + r' \|\| ""\}\s+onChange=\{([^}]+)\}(.*?)(?:disabled=\{([^}]+)\})?\s*>\s*<option[^>]*>.*?</option>\s*\{' + map_code + r'\s*\}\s*</select>'
    
    def repl(m):
        class_name = m.group(1)
        on_change = m.group(2)
        disabled_attr = f' disabled={{{m.group(4)}}}' if m.group(4) else ''
        
        return f'''<input 
              type="text"
              list="{datalist_id}"
              className="{class_name}"
              value={{selectedColaborador.{obj_prop} || ""}}
              onChange={{{on_change}}}{disabled_attr}
              placeholder="Selecione ou digite..."
            />
            <datalist id="{datalist_id}">
              {{{map_code}}}
            </datalist>'''
    
    return re.sub(pattern, repl, content, flags=re.DOTALL)

content = replace_select(content, "unidade", "unidade-list-edit", r'UNIDADES_ORGANICAS_SISTEMA\.map\(u => \(\s*<option key=\{u\.nome\} value=\{u\.nome\}>\{u\.nome\}</option>\s*\)\)', 'unidade')
content = replace_select(content, "direcao", "direcao-list-edit", r'UNIDADES_ORGANICAS_SISTEMA\.find\(u => u\.nome === selectedColaborador\.unidade\)\?\.direcoes\?\.map\(d => \(\s*<option key=\{d\} value=\{d\}>\{d\}</option>\s*\)\)', 'direcao')
content = replace_select(content, "departamento", "departamento-list-edit", r'\(DEPARTAMENTOS_CORRETOS\[selectedColaborador\.direcao as keyof typeof DEPARTAMENTOS_CORRETOS\] \|\| DEPARTAMENTOS\[selectedColaborador\.direcao as keyof typeof DEPARTAMENTOS\] \|\| \[\]\)\?\.map\(d => \(\s*<option key=\{d\} value=\{d\}>\{d\}</option>\s*\)\)', 'departamento')
content = replace_select(content, "reparticao", "reparticao-list-edit", r'REPARTICOES\[selectedColaborador\.departamento as keyof typeof REPARTICOES\]\?\.map\(r => \(\s*<option key=\{r\} value=\{r\}>\{r\}</option>\s*\)\)', 'reparticao')


# The 4 cursos inside map:
curso_map_pattern = r'<select\s+className="([^"]+)"\s+value=\{currentCursos\[idx\] \|\| ""\}\s+onChange=\{\(e\) => \{.*?\setCursos\(newCursos\);\s*\}\}\s*>\s*<option[^>]*>.*?</option>\s*\{CURSOS\[selectedColaborador\.departamento\?\.toString\(\) as keyof typeof CURSOS\]\?\.map\(c => \(\s*<option key=\{c\} value=\{c\}>\{c\}</option>\s*\)\)\}\s*</select>'
def repl_curso_map(m):
    return f'''<input type="text" list={{`curso-list-edit-${{idx}}`}} className="{m.group(1)}" value={{currentCursos[idx] || ""}} onChange={{(e) => {{
                              const newCursos = [...currentCursos];
                              newCursos[idx] = e.target.value;
                              const updates: any = {{ cursos: newCursos }};
                              if (idx === 0) updates.curso = e.target.value;
                              setSelectedColaborador({{ ...selectedColaborador, ...updates }});
                            }}}} placeholder={{`Selecione ou digite Curso ${{idx + 1}}...`}} />
                          <datalist id={{`curso-list-edit-${{idx}}`}}>
                            {{CURSOS[selectedColaborador.departamento?.toString() as keyof typeof CURSOS]?.map(c => (
                              <option key={{c}} value={{c}}>{{c}}</option>
                            ))}}
                          </datalist>'''
content = re.sub(curso_map_pattern, repl_curso_map, content, flags=re.DOTALL)

with open('src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx', 'w') as f:
    f.write(content)

print("Patch GestaoPessoalView applied.")
