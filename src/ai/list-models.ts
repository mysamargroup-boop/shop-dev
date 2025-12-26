
import {
  GoogleGenerativeAI,
} from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY || '';

async function main() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const models = await genAI.listModels();
  for await (const model of models) {
    console.log(model.name);
  }
}

main();
