import express from "express";
import path, { dirname } from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

// Definição compatível com CJS e ESM
const __dirname_final =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.resolve(process.cwd());

// Determinação robusta do ambiente
const IS_PROD =
  process.env.NODE_ENV === "production" || process.env.VITE_PROD === "true";

// Configuração de Caminhos Robusta
const ROOT_DIR = process.cwd();
const DIST_PATH = fs.existsSync(path.resolve(ROOT_DIR, "dist"))
  ? path.resolve(ROOT_DIR, "dist")
  : __dirname_final;
const INDEX_HTML = path.join(DIST_PATH, "index.html");

console.log(`----------------------------------------`);
console.log(`🚀 [SIGEP] Modo: ${IS_PROD ? "PRODUÇÃO" : "DESENVOLVIMENTO"}`);
console.log(`📂 [SIGEP] CWD: ${ROOT_DIR}`);
console.log(`📂 [SIGEP] Pasta Estática: ${DIST_PATH}`);
console.log(
  `📄 [SIGEP] Index HTML: ${INDEX_HTML} (${fs.existsSync(INDEX_HTML) ? "ENCONTRADO" : "NÃO ENCONTRADO"})`,
);
console.log(`----------------------------------------`);

// Função utilitária para fallback offline do Grammarly
function getOfflineGrammarlyResult(text: string, message: string) {
  const localCorrections = [];
  let correctedText = text;
  const lowerText = text.toLowerCase();

  // Correções locais simples para amostragem/fallback
  if (lowerText.includes("faser")) {
    correctedText = correctedText.replace(/faser/gi, "fazer");
    localCorrections.push({
      original: "faser",
      replacement: "fazer",
      explanation: "Ortografia incorreta. O verbo 'fazer' escreve-se com 'z'.",
      type: "spelling",
    });
  }
  if (lowerText.includes("os relatorio")) {
    correctedText = correctedText.replace(/os relatorio/gi, "os relatórios");
    localCorrections.push({
      original: "os relatorio",
      replacement: "os relatórios",
      explanation:
        "Erro de número. Os artigos pluralizados requerem substantivos pluralizados.",
      type: "grammar",
    });
  }

  return {
    correctedText,
    summary: message,
    corrections: localCorrections,
    offline: true,
  };
}

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY process env is missing");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export async function createServer() {
  const app = express();
  const PORT = 3000;

  // Middleware para JSON com limite aumentado para imagens base64
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Rota de saúde da API
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "SIGEP Backend is running",
      timestamp: new Date().toISOString(),
      mode: IS_PROD ? "production" : "development",
      cwd: process.cwd(),
      distPath: DIST_PATH,
      indexExists: fs.existsSync(INDEX_HTML),
    });
  });

  // Rota de análise Grammarly AI
  app.post("/api/grammarly/check", async (req, res) => {
    const { text, mode } = req.body;

    if (!text || typeof text !== "string") {
      res
        .status(400)
        .json({ error: "O texto é obrigatório e deve ser uma string." });
      return;
    }

    try {
      const isKeyAvailable = !!process.env.GEMINI_API_KEY;
      if (!isKeyAvailable) {
        return res.json(
          getOfflineGrammarlyResult(
            text,
            "Texto analisado localmente. Configure sua chave GEMINI_API_KEY nas Configurações para obter análises profundas.",
          ),
        );
      }

      const client = getGeminiClient();

      let promptInstruction =
        "Aja como o assistente Grammarly de Língua Portuguesa.\n";
      promptInstruction +=
        "Analise gramaticalmente, ortograficamente, em estilo e clareza o texto fornecido pelo usuário.\n";

      if (mode === "formal") {
        promptInstruction +=
          "O modo selecionado pelo usuário é FORMAL. Reescreva de forma formal, polida, profissional e adequada para correspondências oficiais, acadêmicas ou administrativas no ISPS (Instituto Superior Politécnico de Songo).\n";
      } else if (mode === "simple") {
        promptInstruction +=
          "O modo selecionado pelo usuário é SIMPLES. Simplifique termos rebuscados, de forma que o texto seja direto, claro e extremamente inteligível sem perder as informações originais.\n";
      } else if (mode === "expand") {
        promptInstruction +=
          "O modo selecionado pelo usuário é EXPANDIR. Enriqueça a descrição das atividades, objetivos ou observações de forma técnica, construtiva e realista.\n";
      } else {
        promptInstruction +=
          "O modo selecionado pelo usuário é PADRÃO. Faça correções de ortografia, concordância e pequenos ajustes de clareza sem alterar o estilo original de escrita.\n";
      }

      promptInstruction +=
        "Identifique termos individuais ou frases para serem substituídos e retorne a lista de correções específicas. Toda a sua resposta deve ser em Português de Moçambique/padrão.";

      let response;
      let usedBackupModel = false;
      let usedOfflineFallback = false;

      const responseSchemaConfig = {
        type: "object",
        properties: {
          correctedText: {
            type: "string",
            description:
              "O texto final integral totalmente corrigido e refinado conforme as regras do modo selecionado.",
          },
          summary: {
            type: "string",
            description:
              "Um resumo conciso das alterações, em português (ex: 'Ortografia corrigida e 1 termo formalizado').",
          },
          corrections: {
            type: "array",
            description:
              "Lista de termos específicos que foram alterados para que o usuário possa aprová-los individualmente.",
            items: {
              type: "object",
              properties: {
                original: {
                  type: "string",
                  description:
                    "A palavra ou trecho original incorreto/melhorável como estava escrito originalmente.",
                },
                replacement: {
                  type: "string",
                  description: "A sugestão ideal de substituição.",
                },
                explanation: {
                  type: "string",
                  description:
                    "Explicação em poucas palavras em português do porquê desta alteração.",
                },
                type: {
                  type: "string",
                  description:
                    "O tipo de erro ou melhoria. Deve ser estritamente 'spelling', 'grammar', 'style' ou 'clarity'.",
                },
              },
              required: ["original", "replacement", "explanation", "type"],
            },
          },
        },
        required: ["correctedText", "summary", "corrections"],
      };

      try {
        response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [promptInstruction, `Texto a analisar: "${text}"`],
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchemaConfig,
          },
        });
      } catch (err35: any) {
        console.warn(
          "gemini-2.5-flash com alta demanda ou indisponível. Tentando gemini-2.5-pro como plano B...",
          err35.message || err35,
        );
        try {
          response = await client.models.generateContent({
            model: "gemini-2.5-pro",
            contents: [promptInstruction, `Texto a analisar: "${text}"`],
            config: {
              responseMimeType: "application/json",
              responseSchema: responseSchemaConfig,
            },
          });
          usedBackupModel = true;
        } catch (errLite: any) {
          console.error(
            "Falha ao comunicar com ambos os modelos de IA due a alta demanda:",
            errLite,
          );
          usedOfflineFallback = true;
        }
      }

      if (usedOfflineFallback || !response) {
        return res.json(
          getOfflineGrammarlyResult(
            text,
            "Análise concluída usando motor de redundância local devido à alta demanda temporária no servidor de IA.",
          ),
        );
      }

      const jsonText = response.text || "{}";
      const resultData = JSON.parse(jsonText.trim());

      if (usedBackupModel) {
        resultData.summary = `[Plan B] ${resultData.summary || "Texto analisado com sucesso."}`;
      }

      res.json(resultData);
    } catch (error: any) {
      console.error("Erro na análise do Grammarly:", error);
      res.status(500).json({
        error:
          "Falha ao analisar gramática com a IA. Por favor, tente novamente mais tarde.",
        details: error?.message || "",
      });
    }
  });

  // Rota de verificação de documentos de reposição de teste usando IA
  app.post("/api/verify-documents", async (req, res) => {
    const { motivo, isBase64Images } = req.body; // isBase64Images is array of base64 strings with mime types

    if (!motivo || !isBase64Images || !Array.isArray(isBase64Images)) {
      res
        .status(400)
        .json({
          error:
            "Motivo e imagens(base64) são obrigatórios para a verificação.",
        });
      return;
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        res
          .status(500)
          .json({ error: "Chave da API do Gemini não configurada." });
        return;
      }
      const client = getGeminiClient();

      const parts: any[] = [
        {
          text: `Por favor, atue como um sistema de auditoria acadêmica escolar. Analise o seguinte motivo fornecido pelo estudante para fazer uma reposição de teste: "${motivo}". As imagens fornecidas são o Talão de Depósito e o Justificativo/Receita Médica em anexo. 1. Verifique se as imagens são comprovativos legítimos. 2. Verifique se o motivo descrito pelo aluno bate de facto com a documentação em anexo. Forneça o resultado de forma estruturada indicando se parece tudo válido ou suspeito.`,
        },
      ];

      for (const img of isBase64Images) {
        // Expecting img format: data:image/png;base64,.....
        const match = img.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      const responseSchemaConfig = {
        type: "object",
        properties: {
          valido: {
            type: "boolean",
            description:
              "Verdadeiro se os documentos parecem autênticos e batem com a justificativa, Falso caso haja discrepâncias suspeitas.",
          },
          analise: {
            type: "string",
            description:
              "Uma explicação detalhada das razões da verificação (o que foi visto nos documentos, como se alinham com o motivo).",
          },
        },
        required: ["valido", "analise"],
      };

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchemaConfig,
        },
      });

      const resultText = response.text || "{}";
      const resultData = JSON.parse(resultText.trim());
      res.json(resultData);
    } catch (error: any) {
      console.error("Erro na verificação de documentos:", error);
      res
        .status(500)
        .json({ error: "Falha ao verificar os documentos via IA." });
    }
  });

  // Configuração de ambiente e serving
  if (!IS_PROD) {
    try {
      console.log("🛠️ Iniciando Vite Middleware...");
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true, host: "0.0.0.0", port: 3000 },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn("⚠️ Vite falhou, usando fallback estático.");
      app.use(express.static(DIST_PATH));
    }
  } else {
    app.use(express.static(DIST_PATH));
  }

  // Rota de Diagnóstico Rápido
  app.get("/api/ping", (req, res) => res.send("pong"));

  // Rota de Diagnóstico Completo
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "SIGEP Backend is running",
      timestamp: new Date().toISOString(),
      mode: IS_PROD ? "production" : "development",
      cwd: process.cwd(),
      root: ROOT_DIR,
      distPath: DIST_PATH,
      indexHtml: INDEX_HTML,
      indexExists: fs.existsSync(INDEX_HTML),
    });
  });

  // Rota global para suportar SPA (Single Page Application)
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint não encontrado" });
    }

    if (fs.existsSync(INDEX_HTML)) {
      res.sendFile(INDEX_HTML);
    } else {
      console.error(
        `❌ Erro Crítico: index.html não encontrado em ${INDEX_HTML}`,
      );
      res.status(404).send(`
        <div style="font-family: sans-serif; padding: 2rem; color: #333; line-height: 1.6;">
          <h1 style="color: #e53e3e;">Erro 404: SIGEP não encontrado</h1>
          <p>O servidor não conseguiu localizar os ficheiros necessários para abrir a aplicação.</p>
          <div style="background: #f7fafc; padding: 1rem; border-radius: 4px; border: 1px solid #edf2f7; margin: 1rem 0;">
             <strong>Detalhes técnicos para o suporte:</strong><br>
             <code style="font-size: 0.85rem;">Caminho: ${INDEX_HTML}</code><br>
             <code style="font-size: 0.85rem;">Diretório: ${process.cwd()}</code>
          </div>
          <p><strong>Sugestão:</strong> Tente atualizar a página ou aguarde um momento enquanto o sistema sincroniza.</p>
        </div>
      `);
    }
  });

  // Somente iniciar o listen se não estivermos no Vercel
  if (!process.env.VERCEL) {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`----------------------------------------`);
      console.log(`🚀 SIGEP Server running on port ${PORT}`);
      console.log(`🏠 Mode: ${IS_PROD ? "Production" : "Development"}`);
      console.log(`----------------------------------------`);
    });
  }

  return app;
}

const appPromise = createServer();

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
