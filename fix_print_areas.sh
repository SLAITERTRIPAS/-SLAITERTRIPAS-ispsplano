#!/bin/bash
# 1. DocumentReaderModal
sed -i 's/<div id="print-area"/<div/g' src/components/DocumentReaderModal.tsx
sed -i 's/<div\s*className="w-full max-w-4xl bg-white/<div id="print-area" className="w-full max-w-4xl bg-white/g' src/components/DocumentReaderModal.tsx

# 2. JustificacaoFaltaDispensaForm
sed -i 's/<div\s*className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 bg-slate-900/<div id="print-area" className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 bg-white/g' src/blocos/bloco6_documentos/JustificacaoFaltaDispensaForm.tsx
# In Justificacao, we also need to change text-slate-100 to text-slate-900 for print readability
sed -i 's/text-slate-100 rounded-2xl/text-slate-900 rounded-2xl/g' src/blocos/bloco6_documentos/JustificacaoFaltaDispensaForm.tsx

# 3. AcaoOrcamentalView
# In AcaoOrcamentalView, there are tabs. The table is printed.
# We'll just put id="print-area" on the table container. Or remove it if already there and reposition.
sed -i 's/id="print-area" //g' src/components/AcaoOrcamentalView.tsx

# 4. PlanoWorkflowView
sed -i 's/id="print-area" //g' src/blocos/bloco5_sistema/PlanoWorkflowView.tsx

