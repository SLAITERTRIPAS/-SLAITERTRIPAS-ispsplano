import re

with open('src/blocos/bloco5_sistema/ActivityForm.tsx', 'r') as f:
    content = f.read()

target = r'''  // Use Firestore colaboradores if available, fallback to FUNCIONARIOS
  const employeeOptions = colaboradores\.length > 0 
    \? colaboradores\.map\(c => \(\{ value: c\.nome, label: `\$\{c\.nome\} \(\$\{c\.cargo \|\| c\.funcao \|\| 'Colaborador'\}\)` \}\)\)
    : FUNCIONARIOS\.map\(f => \(\{ value: f\.nome, label: `\$\{f\.nome\} \(\$\{f\.cargo\}\)` \}\)\);

  const leadershipOptions = colaboradores\.length > 0
    \? colaboradores\.filter\(c => \{
        const cargoLower = \(c\.cargo \|\| c\.funcao \|\| ''\)\.toLowerCase\(\);
        return cargoLower\.includes\('chefe'\) \|\| cargoLower\.includes\('diretor'\);
      \}\)\.map\(c => \(\{ value: c\.nome, label: `\$\{c\.nome\} \(\$\{c\.cargo \|\| c\.funcao \|\| 'Responsável'\}\)` \}\)\)
    : FUNCIONARIOS\.filter\(f => f\.cargo\.toLowerCase\(\)\.includes\('chefe'\) \|\| f\.cargo\.toLowerCase\(\)\.includes\('diretor'\)\)\.map\(f => \(\{ value: f\.nome, label: `\$\{f\.nome\} \(\$\{f\.cargo\}\)` \}\)\);'''

replacement = '''  // Use Firestore colaboradores if available, fallback to FUNCIONARIOS
  const responsavelOptions = colaboradores.length > 0
    ? colaboradores.filter(c => {
        const cargo = (c.cargo || c.funcao || '').toLowerCase();
        return cargo.includes('chefe') || cargo.includes('departamento') || cargo.includes('repartição') || cargo.includes('reparticao');
      }).map(c => ({ value: c.nome, label: `${c.nome} (${c.cargo || c.funcao || 'Responsável'})` }))
    : FUNCIONARIOS.filter(f => {
        const cargo = f.cargo.toLowerCase();
        return cargo.includes('chefe') || cargo.includes('departamento') || cargo.includes('repart');
      }).map(f => ({ value: f.nome, label: `${f.nome} (${f.cargo})` }));

  const outrosColaboradoresOptions = colaboradores.length > 0
    ? colaboradores.filter(c => {
        const cargo = (c.cargo || c.funcao || '').toLowerCase();
        return cargo.includes('diretor') || cargo.includes('adjunto') || cargo.includes('central');
      }).map(c => ({ value: c.nome, label: `${c.nome} (${c.cargo || c.funcao || 'Colaborador'})` }))
    : FUNCIONARIOS.filter(f => {
        const cargo = f.cargo.toLowerCase();
        return cargo.includes('diretor') || cargo.includes('adjunto');
      }).map(f => ({ value: f.nome, label: `${f.nome} (${f.cargo})` }));'''

content = re.sub(target, replacement, content)

target2 = r'''                <SearchableSelect
                  value=\{formData\.responsavel\}
                  onChange=\{\(val\) => setFormData\(\{ \.\.\.formData, responsavel: val \}\)\}
                  options=\{employeeOptions\}
                  placeholder="Selecione o Responsável\.\.\."
                  className="w-full"
                />'''

replacement2 = '''                <SearchableSelect
                  value={formData.responsavel}
                  onChange={(val) => setFormData({ ...formData, responsavel: val })}
                  options={responsavelOptions}
                  placeholder="Selecione o Responsável..."
                  className="w-full"
                />'''

content = re.sub(target2, replacement2, content)

target3 = r'''                <SearchableSelect
                  value=\{formData\.outrosColaboradores\}
                  onChange=\{\(val\) => setFormData\(\{ \.\.\.formData, outrosColaboradores: val \}\)\}
                  options=\{leadershipOptions\}
                  placeholder="Selecione Colaboradores\.\.\."
                  className="w-full"
                />'''

replacement3 = '''                <SearchableSelect
                  value={formData.outrosColaboradores}
                  onChange={(val) => setFormData({ ...formData, outrosColaboradores: val })}
                  options={outrosColaboradoresOptions}
                  placeholder="Selecione Colaboradores..."
                  className="w-full"
                />'''

content = re.sub(target3, replacement3, content)

with open('src/blocos/bloco5_sistema/ActivityForm.tsx', 'w') as f:
    f.write(content)
