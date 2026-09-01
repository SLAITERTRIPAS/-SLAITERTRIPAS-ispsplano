import React, { useRef } from "react";
import { Camera } from "lucide-react";

const TInput = ({
  field,
  value,
  onChange,
  className = "",
  placeholder = "",
}: {
  field: string;
  value: string;
  onChange?: (f: string, v: any) => void;
  className?: string;
  placeholder?: string;
}) => {
  if (onChange) {
    return (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        className={`bg-transparent outline-none focus:bg-blue-50/50 w-full text-center font-inherit font-bold text-gray-900 ${className}`}
      />
    );
  }
  return (
    <span className={`font-bold text-gray-900 ${className}`}>
      {value || placeholder}
    </span>
  );
};

const TInputArr = ({
  index,
  field,
  arr,
  onChange,
  className = "",
}: {
  index: number;
  field: string;
  arr: string[];
  onChange?: (f: string, v: any) => void;
  className?: string;
}) => {
  if (onChange) {
    return (
      <input
        type="text"
        value={arr[index] || ""}
        onChange={(e) => {
          const newArr = [...arr];
          newArr[index] = e.target.value;
          onChange(field, newArr);
        }}
        className={`bg-transparent outline-none focus:bg-blue-50/50 w-full font-inherit font-bold text-gray-900 ${className}`}
      />
    );
  }
  return (
    <span className={`font-bold text-gray-900 ${className}`}>
      {arr[index] || ""}
    </span>
  );
};

export default function CartaoAssistenciaMedicaImpressao({
  cartao,
  isPreview = false,
  onChange,
  signatures,
}: {
  cartao?: any;
  isPreview?: boolean;
  onChange?: (field: string, value: any) => void;
  signatures?: any[];
}) {
  const c = cartao || {};
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onChange) {
      const reader = new FileReader();
      reader.onloadend = () => onChange("foto", reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`${isPreview ? "block shadow-2xl" : "hidden print:block"} w-[210mm] min-h-[297mm] mx-auto pt-16 px-16 pb-16 text-black bg-white select-none relative`}
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      {/* HEADER ROW */}
      <div className="flex justify-between items-start mb-6 text-[14px]">
        <span className="font-bold">128—(22)</span>
        <span className="italic">I SÉRIE — NÚMERO 23</span>
      </div>

      <div className="border-t border-black mb-8 w-full"></div>

      {/* TOP SECTION: 2 COLUMNS */}
      <div className="grid grid-cols-2 gap-12 mt-8 text-[12px] p-4 h-[10.5cm]">
        {/* TOP LEFT */}
        <div className="space-y-4">
          <div
            className={`w-[3cm] h-[3cm] border border-black overflow-hidden flex items-center justify-center relative group ${onChange ? "cursor-pointer hover:opacity-90 transition-all" : ""}`}
            onClick={() => onChange && photoInputRef.current?.click()}
          >
            {c.foto ? (
              <img
                src={c.foto}
                alt="Foto"
                className="w-full h-full object-cover"
              />
            ) : null}
            {onChange && (
              <div
                className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white transition-opacity ${c.foto ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
              >
                <Camera size={24} />
              </div>
            )}
            {onChange && (
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
              />
            )}
          </div>

          <div className="space-y-2 mt-4">
            <p className="font-bold text-[10px]">Revalidado até:</p>
            <div className="flex items-end text-[10px] leading-none">
              <span className="flex-1 inline-block">
                <TInput
                  field="revalidadoAte1"
                  value={c.revalidadoAte1}
                  onChange={onChange}
                  className="text-left"
                  placeholder="____/____/____ ,"
                />
              </span>
              <span className="ml-2 font-bold">(3)</span>
            </div>
            <div className="flex items-end text-[10px] leading-none">
              <span className="flex-1 inline-block">
                <TInput
                  field="revalidadoAte2"
                  value={c.revalidadoAte2}
                  onChange={onChange}
                  className="text-left"
                  placeholder="____/____/____ ,"
                />
              </span>
            </div>
            <div className="flex items-end text-[10px] leading-none">
              <span className="flex-1 inline-block">
                <TInput
                  field="revalidadoAte3"
                  value={c.revalidadoAte3}
                  onChange={onChange}
                  className="text-left"
                  placeholder="____/____/____ ,"
                />
              </span>
            </div>
            <div className="flex items-end text-[10px] leading-none">
              <span className="flex-1 inline-block">
                <TInput
                  field="revalidadoAte4"
                  value={c.revalidadoAte4}
                  onChange={onChange}
                  className="text-left"
                  placeholder="____/____/____ ,"
                />
              </span>
            </div>
            <div className="flex items-end text-[10px] leading-none">
              <span className="flex-1 inline-block">
                <TInput
                  field="revalidadoAte5"
                  value={c.revalidadoAte5}
                  onChange={onChange}
                  className="text-left"
                  placeholder="____/____/____ ,"
                />
              </span>
            </div>
          </div>

          <div className="text-[9px] mt-6 space-y-0.5 font-bold">
            <p>1) Indicação do serviço.</p>
            <p>2) Indicação de nome e parentesco.</p>
            <p>3) Assinatura do responsável pelo registo e revalidação.</p>
            <p>4) Assinatura do dirigente e selo branco ou carimbo a óleo.</p>
          </div>
        </div>

        {/* TOP RIGHT */}
        <div className="flex flex-col items-center text-center">
          <div className="w-full flex justify-between font-bold text-[10px] mb-8">
            <span>(Artigo 8 do Regulamento)</span>
            <span>(Capa)</span>
          </div>
          <div className="w-12 h-12 mb-2">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Emblem_of_Mozambique.svg/500px-Emblem_of_Mozambique.svg.png"
              alt="Emblema de Moçambique"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="font-bold text-[11px] mb-8">
            Instituto Superior Politécnico de Songo
          </h2>

          <h1 className="text-[14px] font-bold text-center leading-tight">
            Cartão De Assistência
            <br />
            Médica E Medicamentosa
            <br />
            Aos Funcionários E Empregados Do
            <br />
            Estado
          </h1>
        </div>
      </div>

      {/* GAP BETWEEN CARDS */}
      <div className="border-t border-black border-dashed my-8 w-full"></div>

      {/* BOTTOM SECTION: 2 COLUMNS */}
      <div className="grid grid-cols-2 gap-12 text-[12px] p-4 h-[10.5cm]">
        {/* BOTTOM LEFT */}
        <div className="space-y-2">
          <div className="flex items-end">
            <span className="mr-2 font-bold text-[10px]">(1)</span>
            <span className="border-b border-black flex-1 text-center font-bold pb-0.5 text-sm">
              <TInput field="servico" value={c.servico} onChange={onChange} />
            </span>
          </div>

          <div className="flex flex-col space-y-0 mt-1">
            <span className="font-bold text-[11px]">
              Nome do funcionário ou empregado:
            </span>
            <span className="border-b border-black w-full text-center font-bold pb-0.5 text-sm inline-block h-5">
              <TInput field="nome" value={c.nome} onChange={onChange} />
            </span>
          </div>

          <div className="flex items-end mt-1">
            <span className="mr-2 font-bold text-[11px]">Categoria</span>
            <span className="border-b border-black flex-1 text-center font-bold pb-0.5">
              <TInput
                field="categoria"
                value={c.categoria}
                onChange={onChange}
              />
            </span>
          </div>

          <div className="mt-1">
            <p className="font-bold text-[10px]">
              Grupo e letra a que pertence, nos termos dos artigos 6 e 7 do
              Regulamento:
            </p>
            <div className="flex items-end mt-1 gap-2">
              <div className="flex flex-1 items-end">
                <span className="mr-1 font-bold text-[10px]">Grupo</span>
                <span className="border-b border-black flex-1 text-center font-bold pb-0.5">
                  <TInput field="grupo" value={c.grupo} onChange={onChange} />
                </span>
              </div>
              <div className="flex flex-1 items-end">
                <span className="mr-1 font-bold text-[10px]">Letra</span>
                <span className="border-b border-black flex-1 text-center font-bold pb-0.5">
                  <TInput field="letra" value={c.letra} onChange={onChange} />
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-end mt-1">
            <span className="mr-2 font-bold text-[11px]">Morada</span>
            <span className="border-b border-black flex-1 text-center font-bold pb-0.5">
              <TInput field="morada" value={c.morada} onChange={onChange} />
            </span>
          </div>

          <div className="mt-1 text-[10px]">
            <p className="font-bold mb-0.5">Beneficiários:</p>
            <div className="flex items-end">
              <span className="mr-2 font-bold text-[10px]">a) Cônjuge</span>
              <span className="border-b border-black flex-1 font-bold pb-0.5 pl-1">
                <TInput
                  field="conjuge"
                  value={c.conjuge}
                  onChange={onChange}
                  className="text-left"
                />
              </span>
            </div>

            <div className="mt-1 space-y-0.5">
              <p className="font-bold text-[10px]">
                b) Outras pessoas de família: (2)
              </p>
              {Array.from({
                length: Math.max(3, c.outrosFamiliares?.length || 3),
              }).map((_, index) => (
                <div key={index} className="flex items-center gap-1 mb-1">
                  <div className="border-b border-black flex-1 h-4 font-bold pl-1 text-[10px]">
                    <TInputArr
                      index={index}
                      field="outrosFamiliares"
                      arr={c.outrosFamiliares || []}
                      onChange={onChange}
                      className="text-left leading-4"
                    />
                  </div>
                  {c.documentosDependentes?.[index] ? (
                    <div className="flex gap-1 items-center">
                      <span className="text-[9px] truncate w-16">
                        {typeof c.documentosDependentes[index] === "string"
                          ? c.documentosDependentes[index].split("/").pop()
                          : c.documentosDependentes[index].name}
                      </span>
                      <button
                        type="button"
                        className="text-[8px] bg-blue-500 text-white p-0.5 rounded hover:bg-blue-600"
                        onClick={() => {
                          const file = c.documentosDependentes[index];
                          if (typeof file === "string") {
                            window.open(file, "_blank");
                          } else {
                            const url = URL.createObjectURL(file);
                            window.open(url, "_blank");
                          }
                        }}
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        className="text-[8px] bg-red-500 text-white p-0.5 rounded hover:bg-red-600"
                        onClick={() => {
                          const newDocs = [...(c.documentosDependentes || [])];
                          newDocs[index] = null;
                          onChange?.("documentosDependentes", newDocs);
                        }}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      className="text-[9px] w-16"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0] && onChange) {
                          const newDocs = [...(c.documentosDependentes || [])];
                          newDocs[index] = e.target.files[0];
                          onChange("documentosDependentes", newDocs);
                        }
                      }}
                    />
                  )}
                </div>
              ))}
              {onChange && (
                <button
                  type="button"
                  className="mt-1 p-1 bg-black text-white text-[9px] font-bold rounded hover:bg-gray-800"
                  onClick={() =>
                    onChange("outrosFamiliares", [
                      ...(c.outrosFamiliares || []),
                      "",
                    ])
                  }
                >
                  +
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT */}
        <div className="flex flex-col text-[11px]">
          <div className="w-full text-right font-bold italic mb-4">
            (Frente)
          </div>

          <div className="space-y-3 text-[11px]">
            <div className="flex items-end whitespace-nowrap">
              <span className="font-bold">Emitido em</span>
              <span className="border-b border-black flex-1 mx-1 text-center font-bold pb-0.5">
                <TInput
                  field="localEmissao"
                  value={c.localEmissao}
                  onChange={onChange}
                />
              </span>
              <span className="font-bold">, aos</span>
              <span className="border-b border-black w-10 text-center mx-1 font-bold pb-0.5">
                <TInput
                  field="diaEmissao"
                  value={c.diaEmissao}
                  onChange={onChange}
                />
              </span>
              <span className="font-bold">de</span>
            </div>
            <div className="flex items-end whitespace-nowrap">
              <span className="border-b border-black flex-1 text-center mx-1 font-bold pb-0.5">
                <TInput
                  field="mesEmissao"
                  value={c.mesEmissao}
                  onChange={onChange}
                />
              </span>
              <span className="font-bold">de</span>
              <span className="border-b border-black w-14 text-center mx-1 font-bold pb-0.5">
                <TInput
                  field="anoEmissao"
                  value={c.anoEmissao}
                  onChange={onChange}
                />
              </span>
            </div>

            <div className="flex items-end mt-2">
              <span className="mr-2 font-bold">Válido até</span>
              <span className="border-b border-black flex-1 text-center font-bold pb-0.5">
                <TInput
                  field="validoAte"
                  value={c.validoAte}
                  onChange={onChange}
                />
              </span>
            </div>

            <div className="flex items-end mt-2">
              <span className="mr-2 font-bold">Registado sob o n.º</span>
              <span className="border-b border-black flex-1 text-center font-bold pb-0.5">
                <TInput
                  field="numeroRegisto"
                  value={c.numeroRegisto}
                  onChange={onChange}
                />
              </span>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="mt-4 text-right px-2 font-bold text-[10px]">
            O Encarregado, (3)
          </div>
          <div className="border-b border-black w-1/2 ml-auto mt-6 relative">
            {c.signatureOEncarregado && (
              <img
                src={c.signatureOEncarregado}
                className="absolute bottom-0 w-full h-12 object-contain"
              />
            )}
            {onChange && (
              <select
                className="w-full text-[9px] bg-transparent outline-none"
                onChange={(e) =>
                  onChange("signatureOEncarregado", e.target.value)
                }
              >
                <option value="">Selecionar assinatura</option>
                {signatures?.map((s) => (
                  <option key={s.id} value={s.data}>
                    {s.userName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mt-4 px-2 font-bold text-[10px]">Confirmo: (4)</div>
          <div className="border-b border-black w-full mt-6 relative">
            {c.signatureConfirmo && (
              <img
                src={c.signatureConfirmo}
                className="absolute bottom-0 w-full h-12 object-contain"
              />
            )}
            {onChange && (
              <select
                className="w-full text-[9px] bg-transparent outline-none"
                onChange={(e) => onChange("signatureConfirmo", e.target.value)}
              >
                <option value="">Selecionar assinatura</option>
                {signatures?.map((s) => (
                  <option key={s.id} value={s.data}>
                    {s.userName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mt-4 px-2 font-bold text-[10px]">
            Assinatura do Titular:
          </div>
          <div className="border-b border-black w-full mt-6 relative">
            {c.signatureTitular && (
              <img
                src={c.signatureTitular}
                className="absolute bottom-0 w-full h-12 object-contain"
              />
            )}
            {onChange && (
              <select
                className="w-full text-[9px] bg-transparent outline-none"
                onChange={(e) => onChange("signatureTitular", e.target.value)}
              >
                <option value="">Selecionar assinatura</option>
                {signatures?.map((s) => (
                  <option key={s.id} value={s.data}>
                    {s.userName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <></>
        </div>
      </div>
    </div>
  );
}
