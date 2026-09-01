import re

with open('src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx', 'r') as f:
    content = f.read()

def replace_basic_select(content, var_name, datalist_id, map_code, obj_prop):
    pattern = r'<select\s+className="([^"]+)"\s+value=\{selectedColaborador\.' + obj_prop + r'\}\s+onChange=\{([^}]+)\}\s*>\s*<option[^>]*>.*?</option>\s*\{' + map_code + r'\s*\}\s*</select>'
    
    def repl(m):
        class_name = m.group(1)
        on_change = m.group(2)
        
        return f'''<input 
              type="text"
              list="{datalist_id}"
              className="{class_name}"
              value={{selectedColaborador.{obj_prop} || ""}}
              onChange={{{on_change}}}
              placeholder="Selecione ou digite..."
            />
            <datalist id="{datalist_id}">
              {{{map_code}}}
            </datalist>'''
    
    return re.sub(pattern, repl, content, flags=re.DOTALL)

content = replace_basic_select(content, "nivelAcademico", "nivel-academico-list", r'NIVEIS_ACADEMICOS\.map\(nivel => \(\s*<option key=\{nivel\} value=\{nivel\}>\{nivel\}</option>\s*\)\)', 'nivelAcademico')
content = replace_basic_select(content, "categoria", "categoria-list", r'CATEGORIAS_FUNCIONARIOS\.map\(c => <option key=\{c\} value=\{c\}>\{c\}</option>\)', 'categoria')
# The others like carreira use specific arrays like ['Docente', 'Investigador', 'CTA']
content = replace_basic_select(content, "carreira", "carreira-list", r'\[' + "'.*?'" + r'(?:,\s*'.*?'\s*)*\]\.map\(c => \(\s*<option key=\{c\} value=\{c\}>\{c\}</option>\s*\)\)', 'carreira')

with open('src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx', 'w') as f:
    f.write(content)

print("Patch more selects applied.")
