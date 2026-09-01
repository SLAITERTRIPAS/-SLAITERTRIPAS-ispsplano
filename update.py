import re

with open('src/blocos/bloco5_sistema/ActivityForm.tsx', 'r') as f:
    content = f.read()

target = r'''                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-\[11px\] font-bold text-blue-800 uppercase tracking-tight ml-1">Rúbrica</label>
                        <select 
                          value=\{rubrica.rubrica\}
                          disabled=\{isBlocked\}
                          onChange=\{\(e\) => \{
                            const newRubricas = \[\.\.\.formData\.rubricas\];
                            newRubricas\[index\] = \{ \.\.\.rubrica, rubrica: e\.target\.value, necessidade: '' \};
                            setFormData\(\{ \.\.\.formData, rubricas: newRubricas \}\);
                          \}\}
                          className="w-full p-2\.5 border-2 border-gray-300 rounded-xl text-\[13px\] font-bold outline-none focus:border-blue-900 transition-all bg-white h-12"
                        >'''

replacement = '''                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[12px] font-serif font-black text-blue-900 uppercase tracking-wide ml-2">Rúbrica</label>
                          <select 
                            value={rubrica.rubrica}
                            disabled={isBlocked}
                            onChange={(e) => {
                              const newRubricas = [...formData.rubricas];
                              newRubricas[index] = { ...rubrica, rubrica: e.target.value, necessidade: '' };
                              setFormData({ ...formData, rubricas: newRubricas });
                            }}
                            className="w-full px-5 py-3 border border-blue-900/40 rounded-2xl text-[14px] font-bold text-gray-800 outline-none focus:border-blue-900 transition-all bg-white h-[52px] shadow-sm appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1.2rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                        >'''

content = re.sub(target, replacement, content)

target2 = r'''                      <div className="space-y-1">
                        <label className="block text-\[11px\] font-bold text-blue-800 uppercase tracking-tight ml-1">Necessidade</label>
                        <select 
                          value=\{rubrica\.necessidade\}
                          disabled=\{isBlocked \|\| !rubrica\.rubrica\}
                          onChange=\{\(e\) => \{
                            updateRubricaNecessidade\(index, e\.target\.value\);
                          \}\}
                          className="w-full p-2\.5 border-2 border-gray-300 rounded-xl text-\[13px\] font-bold outline-none focus:border-blue-900 transition-all bg-white h-12"
                        >'''

replacement2 = '''                      <div className="space-y-2">
                        <label className="block text-[12px] font-serif font-black text-blue-900 uppercase tracking-wide ml-2">Necessidade</label>
                        <select 
                          value={rubrica.necessidade}
                          disabled={isBlocked || !rubrica.rubrica}
                          onChange={(e) => {
                            updateRubricaNecessidade(index, e.target.value);
                          }}
                          className="w-full px-5 py-3 border border-blue-900/40 rounded-2xl text-[14px] font-bold text-gray-800 outline-none focus:border-blue-900 transition-all bg-white h-[52px] shadow-sm appearance-none"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1.2rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                        >'''

content = re.sub(target2, replacement2, content)

target3 = r'''                    \{isAjudaCusto \? \('''
replacement3 = '''                    {isAjudaCusto ? ('''
# Wait, need to close the `<div className="space-y-6">` before `</div>` at the end of the rubricas map. Let's look for the end of the map.
# Actually I added <div className="space-y-6"> at the very top. So it encapsulates Rúbrica/Necessidade and the sub-fields.

with open('src/blocos/bloco5_sistema/ActivityForm.tsx', 'w') as f:
    f.write(content)
