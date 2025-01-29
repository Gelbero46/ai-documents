import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { NextResponse } from "next/server";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Utility function to clean pageContent
const cleanPageContent = (content: string) => {
  // Remove everything before the first newline
  const withoutHeader = content.replace(/^[^\n]*\n/, '');

  // Replace multiple spaces with a single space and trim the text
  const cleanedText = withoutHeader.replace(/[^\S\n]+/g, ' ').trim();

  // Remove triple dot
  const withoutTripleDot = cleanedText.replace(/\.{3}.*/, '');

  // Split the text into sentences using \n as the delimiter
  const sentenceArray = withoutTripleDot.split('\n');

  return sentenceArray;
    
};

export async function POST(req: Request) {
  try {
    const { question, documentId } = await req.json();

    // Validate input
    if (!question?.trim() || !documentId) {
      return new Response("Missing question or documentId", { status: 400 });
    }

    // Initialize embeddings and vector store
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
    });

    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      filter: { documentId },
    });

    // Perform similarity search
    const results = await vectorStore.similaritySearch(question, 4);
    if (results.length === 0) {
      return NextResponse.json({
        answer: "I don't know the answer to that question.",
        sources: [],
      });
    }

    // Extract content for context and prepare metadata
    const sources = results.map((r) => ({
      pageContent: cleanPageContent(r.pageContent),
      metadata: {
        pageNumber: r.metadata["loc.pageNumber"]
      } 
    }));

    // Combine contentText for the LLM prompt
    const contentText = results.map((source) => source.pageContent).join("\n");

    // Call OpenAI to generate an answer
    const openai = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      temperature: 0, // For deterministic responses
    });

    const prompt = `You are a helpful AI assistant. Using the following context from the document, 
please answer the question accurately and concisely. If the context doesn't contain 
relevant information to answer the question, please say so.

Context:
\`\`\`
${contentText}
\`\`\`

Question: ${question}`;

    const answer = await openai.invoke(prompt);

    // Return the final response
    return NextResponse.json({
      answer,
      sources, // Add sources to the response
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({
      answer: "An error occurred while processing your question.",
      sources: [],
    });
  }
}
