import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  const { question } = await req.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Create a clean prompt without exposing internal context
  const cleanPrompt = `You are an AI assistant helping a student find information about university papers and related topics. Please answer the following question: ${question}`;

  const result = await model.generateContent(cleanPrompt);
  const response = await result.response;
  const text = response.text();

  return Response.json({ text });
}
