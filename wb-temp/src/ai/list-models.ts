
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY || '';

async function main() {
  const genAI: any = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel
    ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    : null;
  console.log("Model initialized:", !!model);
}

main();
