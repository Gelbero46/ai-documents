import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { NextResponse } from "next/server";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { question, documentId } = await req.json();

    if (!question?.trim() || !documentId) {
      return new Response("Missing question or documentId", { status: 400 });
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
    });

    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      filter: { documentId },
    });

    const results = await vectorStore.similaritySearch(question, 4);

    if (results.length === 0) {
      return NextResponse.json({
        answer: "I don't know the answer to that question",
      });
    }

    const contentText = results.map((r) => r.pageContent).join("\n");

    const openai = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      temperature: 0, // For deterministic responses
    });

    const prompt = `You are a helpful AI assistant. Using the following context from the note below, 
    please answer the question accurately and concisely. If the context doesn't contain 
    relevant information to answer the question, please say so. Your response should a json object
    with keys "answer" and "search" where "answer" is the answer to the question and "search"
    is a substring of the context following consecutively and related to the answer. 

Context:
\`\`\`
${contentText}
\`\`\`

Question: ${question}

Output the response in this exact JSON format:
{
  "answer": "string",
  "search": "string"
}`;

    const response = await openai.invoke(prompt);
    // console.log("response:", response);
    let jsonObject;
    try {
      jsonObject = JSON.parse(response);
      // console.log("jsonObject:", jsonObject);
    } catch (err) {
      console.error("Error parsing JSON:", response);
      return NextResponse.json({
        answer: "I couldn't parse the response.",
      });
    }

    return NextResponse.json(jsonObject);
  } catch (error) {
    console.error("Error processing question:", error);
    return NextResponse.json({
      answer: "An error occurred while processing your question.",
    });
  }
}
