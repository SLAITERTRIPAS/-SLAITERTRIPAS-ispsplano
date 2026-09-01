const fs = require('fs');
const file = 'src/blocos/bloco5_sistema/ActivityForm.tsx';
let code = fs.readFileSync(file, 'utf-8');

const regex = /const calculateIndependentActivityData = \(m: string, originalFormData: any\) => \{[\s\S]*?console\.log\("Submissão concluída com sucesso\."\);/g;

const replacement = `const calculateTotalActivityData = (monthsArr: string[], originalFormData: any) => {
                      let totalDays = 0;
                      if (monthsArr.length === 0) {
                        totalDays = originalFormData.totalDias || 1;
                      } else {
                        monthsArr.forEach(m => {
                          const mDet = originalFormData.mesesDetalhes?.[m] || {};
                          let mDays = 0;
                          const dIni = mDet.dataInicio || "";
                          const dFim = mDet.dataFim || "";
                          if (dIni && dFim) {
                            const d1 = new Date(dIni);
                            const d2 = new Date(dFim);
                            if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d1 <= d2) {
                              mDays = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                            }
                          }
                          if (originalFormData.frequencia === "Anual") {
                            mDays = 1;
                          }
                          totalDays += mDays;
                        });
                      }
                      if (totalDays === 0) {
                        totalDays = originalFormData.totalDias || 1;
                      }

                      const totalRubricas = (originalFormData.rubricas || []).map((rubrica: any) => {
                        const isRubricaPessoal =
                          rubrica.rubrica === "Ajudas de Custo" ||
                          rubrica.rubrica === "Despesas de Deslocação" ||
                          rubrica.rubrica === "Ajudas de Custo por Transferência";
                        const isAjudaCustoDiretorDentro =
                          isRubricaPessoal &&
                          (rubrica.necessidade?.toLowerCase().includes("diretor") ||
                            rubrica.necessidade?.toLowerCase().includes("coordenador")) &&
                          rubrica.necessidade?.toLowerCase().includes("dentro");
                        const isAjudaCustoDiretorFora =
                          isRubricaPessoal &&
                          (rubrica.necessidade?.toLowerCase().includes("diretor") ||
                            rubrica.necessidade?.toLowerCase().includes("coordenador")) &&
                          rubrica.necessidade?.toLowerCase().includes("fora");
                        const isAjudaCustoCivilDentro =
                          isRubricaPessoal &&
                          rubrica.necessidade?.toLowerCase().includes("civil") &&
                          rubrica.necessidade?.toLowerCase().includes("dentro");
                        const isAjudaCustoCivilFora =
                          isRubricaPessoal &&
                          rubrica.necessidade?.toLowerCase().includes("civil") &&
                          rubrica.necessidade?.toLowerCase().includes("fora");
                        const isIdaVoltaGeral =
                          isRubricaPessoal &&
                          rubrica.necessidade?.toLowerCase().includes("ida e volta");
                        const isAjudaCustoMotoristaIdaVolta =
                          isRubricaPessoal &&
                          rubrica.necessidade?.toLowerCase().includes("motorista") &&
                          rubrica.necessidade?.toLowerCase().includes("ida e volta");
                        const isAjudaCustoMotorista =
                          isRubricaPessoal &&
                          rubrica.necessidade?.toLowerCase().includes("motorista") &&
                          !isAjudaCustoMotoristaIdaVolta &&
                          !isIdaVoltaGeral;

                        if (isAjudaCustoDiretorDentro) {
                          const precoUnitario = 9000;
                          const qtd = rubrica.quantidade || 0;
                          const valorTotal = qtd * totalDays * precoUnitario + 0.3 * precoUnitario * qtd;
                          return { ...rubrica, precoUnitario, valorTotal };
                        }
                        if (isAjudaCustoDiretorFora || isAjudaCustoCivilFora) {
                          const precoUnitario = rubrica.precoUnitario || 0;
                          const qtd = rubrica.quantidade || 0;
                          const valorTotal = qtd * totalDays * precoUnitario + 0.3 * precoUnitario * qtd;
                          return { ...rubrica, valorTotal };
                        }
                        if (isAjudaCustoCivilDentro) {
                          const precoUnitario = 6000;
                          const qtd = rubrica.quantidade || 0;
                          const valorTotal = qtd * totalDays * precoUnitario + 0.3 * precoUnitario * qtd;
                          return { ...rubrica, precoUnitario, valorTotal };
                        }
                        if (isIdaVoltaGeral) {
                          const precoUnitario = 1800;
                          const qtd = rubrica.quantidade || 1;
                          const d = 1;
                          const valorTotal = qtd * d * precoUnitario;
                          return { ...rubrica, precoUnitario, quantidade: qtd, valorTotal };
                        }
                        if (isAjudaCustoMotoristaIdaVolta) {
                          const precoUnitario = 1800;
                          const qtd = 1;
                          const d = 2;
                          const valorTotal = qtd * d * precoUnitario;
                          return { ...rubrica, precoUnitario, quantidade: qtd, valorTotal };
                        }
                        if (isAjudaCustoMotorista) {
                          const precoUnitario = 1800;
                          const qtd = 1;
                          const valorTotal = qtd * totalDays * precoUnitario + 0.3 * precoUnitario * qtd;
                          return { ...rubrica, precoUnitario, quantidade: qtd, valorTotal };
                        }
                        if (isRubricaPessoal) {
                          const precoUnitario = rubrica.precoUnitario || 0;
                          const qtd = rubrica.quantidade || 1;
                          const valorTotal = qtd * totalDays * precoUnitario + 0.3 * precoUnitario * qtd;
                          return { ...rubrica, valorTotal };
                        }
                        return rubrica;
                      });

                      const totalOrcamento = totalRubricas.reduce(
                        (acc: number, r: any) => acc + (r.valorTotal || 0),
                        0,
                      );

                      return {
                        totalDias: totalDays,
                        rubricas: totalRubricas,
                        orcamento: totalOrcamento,
                        valor: totalOrcamento,
                      };
                    };

                    const persistDepartmentAndProducts = (data: any) => {
                      const dept = data.departamento || data.unidadeOrganica || currentSector || selectedCategory;
                      if (dept) {
                        saveDepartmentActivity(dept, data);
                      }
                      if (data.rubricas && Array.isArray(data.rubricas)) {
                        data.rubricas.forEach((r: any) => collectProductFromRubric(r));
                      }
                    };

                    const submissionData = {
                      ...formData,
                      ...calculateTotalActivityData(months, formData),
                      title: formData.nomeAtividade,
                      nAtividade: formData.numeroAtividade,
                      selectedCategory,
                      ano: nextYear,
                      mesesRealizacao: months,
                      mesRealizacao: months[0] || formData.mesRealizacao || formData.mes || "",
                    };

                    persistDepartmentAndProducts(submissionData);
                    const submissionPromise = onSubmit(submissionData);

                    await Promise.race([
                      submissionPromise,
                      new Promise((_, reject) =>
                        setTimeout(
                          () =>
                            reject(
                              new Error(
                                "A submissão está a demorar mais do que o esperado. Verifique a sua ligação à internet.",
                              ),
                            ),
                          25000,
                        ),
                      ),
                    ]);

                    console.log("Submissão concluída com sucesso.");`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
