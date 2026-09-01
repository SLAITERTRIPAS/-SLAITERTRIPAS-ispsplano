import React, { useState, useEffect } from "react";
import { Package, Search, Plus, Inbox } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface MaterialItem {
  id: string;
  codigo?: string;
  material?: string;
  name?: string;
  tipo?: string;
  type?: string;
  marca?: string;
  modelo?: string;
  qtd?: number;
  quantidade?: number;
  estado?: string;
  local?: string;
}

export default function VisaoGeralMateriais({
  local,
  onRegistar,
}: {
  local: string;
  onRegistar: () => void;
}) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "materiais_bens"),
      where("local", "==", local)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MaterialItem[];
        setMaterials(items);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsub();
  }, [local]);

  const filteredMaterials = materials.filter((m) => {
    const term = searchTerm.toLowerCase();
    const name = (m.material || m.name || "").toLowerCase();
    const code = (m.codigo || m.id || "").toLowerCase();
    return name.includes(term) || code.includes(term);
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-blue-900 text-white p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Materiais Existentes: {local}</h2>
          <p className="text-blue-100 text-sm">Gestão de inventário e bens.</p>
        </div>
        <button
          onClick={onRegistar}
          className="bg-white text-blue-900 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 flex items-center gap-2 text-sm transition-all"
        >
          <Plus size={16} />
          Registar Novo
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar material por código ou nome..."
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            A carregar materiais...
          </div>
        ) : filteredMaterials.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="pb-3 font-bold">Código</th>
                  <th className="pb-3 font-bold">Material</th>
                  <th className="pb-3 font-bold">Tipo</th>
                  <th className="pb-3 font-bold">Marca/Modelo</th>
                  <th className="pb-3 font-bold">Qtd</th>
                  <th className="pb-3 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMaterials.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="py-4 font-bold text-blue-900">
                      {m.codigo || m.id}
                    </td>
                    <td className="py-4">{m.material || m.name}</td>
                    <td className="py-4 text-gray-600">{m.tipo || m.type || "Geral"}</td>
                    <td className="py-4 text-gray-600">
                      {m.marca || "N/A"} / {m.modelo || "N/A"}
                    </td>
                    <td className="py-4 font-bold">{m.quantidade || m.qtd || 1}</td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          m.estado === "Bom"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {m.estado || "Operacional"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 flex flex-col items-center gap-2">
            <Inbox size={32} className="text-slate-300" />
            <span className="font-bold text-sm text-slate-600">Nenhum material registado neste local</span>
            <p className="text-xs text-slate-400">Clique em "Registar Novo" para adicionar o primeiro item.</p>
          </div>
        )}
      </div>
    </div>
  );
}
