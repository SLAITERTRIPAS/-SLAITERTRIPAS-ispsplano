import re

with open('src/blocos/bloco8_gerais/IndividualProcessForm.tsx', 'r') as f:
    content = f.read()

# Remove the clears from onChange
content = content.replace(
    '''handleInputChange('unidade', e.target.value);
                    handleInputChange('direcao', '');
                    handleInputChange('departamento', '');
                    handleInputChange('reparticao', '');
                    handleInputChange('curso', '');''',
    "handleInputChange('unidade', e.target.value);"
)
content = content.replace(
    '''handleInputChange('direcao', e.target.value);
                    handleInputChange('departamento', '');
                    handleInputChange('reparticao', '');
                    handleInputChange('curso', '');''',
    "handleInputChange('direcao', e.target.value);"
)
content = content.replace(
    '''console.log('Departamento selecionado:', e.target.value, 'Repartições:', REPARTICOES[e.target.value as keyof typeof REPARTICOES]);
                    handleInputChange('departamento', e.target.value);
                    handleInputChange('reparticao', '');
                    handleInputChange('curso', '');''',
    '''console.log('Departamento selecionado:', e.target.value, 'Repartições:', REPARTICOES[e.target.value as keyof typeof REPARTICOES]);
                    handleInputChange('departamento', e.target.value);'''
)
content = content.replace(
    '''handleInputChange('reparticao', e.target.value);
                    handleInputChange('curso', '');''',
    "handleInputChange('reparticao', e.target.value);"
)


def replace_select(content, var_name, datalist_id, map_code, obj_prop):
    pattern = r'<select\s+className="([^"]+)"\s+value=\{formData\.' + obj_prop + r'\}\s+onChange=\{([^}]+)\}(.*?)(?:disabled=\{([^}]+)\})?\s*>\s*<option[^>]*>.*?</option>\s*\{' + map_code + r'\s*\}\s*</select>'
    
    def repl(m):
        class_name = m.group(1)
        on_change = m.group(2)
        disabled_attr = f' disabled={{{m.group(4)}}}' if m.group(4) else ''
        
        return f'''<input 
                  type="text"
                  list="{datalist_id}"
                  className="{class_name}"
                  value={{formData.{obj_prop}}}
                  onChange={{{on_change}}}{disabled_attr}
                  placeholder="Selecione ou digite..."
                />
                <datalist id="{datalist_id}">
                  {{{map_code}}}
                </datalist>'''
    
    return re.sub(pattern, repl, content, flags=re.DOTALL)

content = replace_select(content, "unidade", "process-unidade-list", r'UNIDADES_ORGANICAS_SISTEMA\.map\(u => \(\s*<option key=\{u\.nome\} value=\{u\.nome\}>\{u\.nome\}</option>\s*\)\)', 'unidade')
content = replace_select(content, "direcao", "process-direcao-list", r'UNIDADES_ORGANICAS_SISTEMA\.find\(u => u\.nome === formData\.unidade\)\?\.direcoes\.map\(d => \(\s*<option key=\{d\} value=\{d\}>\{d\}</option>\s*\)\)', 'direcao')
content = replace_select(content, "departamento", "process-departamento-list", r'\(DEPARTAMENTOS_CORRETOS\[formData\.direcao as keyof typeof DEPARTAMENTOS_CORRETOS\] \|\| DEPARTAMENTOS\[formData\.direcao as keyof typeof DEPARTAMENTOS\]\)\?\.map\(d => \(\s*<option key=\{d\} value=\{d\}>\{d\}</option>\s*\)\)', 'departamento')
content = replace_select(content, "reparticao", "process-reparticao-list", r'REPARTICOES\[formData\.departamento as keyof typeof REPARTICOES\]\?\.map\(r => \(\s*<option key=\{r\} value=\{r\}>\{r\}</option>\s*\)\)', 'reparticao')

with open('src/blocos/bloco8_gerais/IndividualProcessForm.tsx', 'w') as f:
    f.write(content)

print("Patch IndividualProcessForm applied.")
