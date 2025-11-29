import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateViralCopy = async (fileInfo: string): Promise<string> => {
  const modelId = "gemini-2.5-flash"; // Fast model for text generation
  
  const prompt = `
  你是一个小红书文案大师。请根据以下工具的功能和用户上传的文件信息，创作3个版本的小红书种草文案。
  
  工具功能：这是一个可以在线修改文件MD5值的网站。它可以帮助用户通过微调文件内容（不影响使用），改变文件的唯一哈希值，从而不仅能保护隐私，还能在某些平台避免被误判为重复内容。支持批量修改。
  
  用户当前处理的文件信息：${fileInfo}
  
  请严格按照以下要求生成：
  1. **标题微调**：吸引眼球，不超过20字，带有emoji。
  2. **文案微调**：口语化、接地气、有情感、简短易读。
  3. **标签部分**：包含 #MD5修改 #黑科技 #实用工具 #小红书运营 #防查重 #批量处理 等相关标签。
  4. **输出格式**：不要任何多余的解释，直接输出3个版本，每个版本之间用 "||VERSION_SPLIT||" 分隔。
  
  例如：
  版本1标题...
  版本1正文...
  版本1标签...
  ||VERSION_SPLIT||
  版本2...
  ...
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        temperature: 0.8,
      }
    });

    return response.text || "生成失败，请重试。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate copywriting.");
  }
};