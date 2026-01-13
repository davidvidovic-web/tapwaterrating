import { NextResponse } from "next/server";
import { auth } from "@/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, action, context } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "improve":
        systemPrompt = `You are a professional content editor. Improve the given content by:
- Enhancing clarity and readability
- Fixing grammar and spelling
- Improving flow and structure
- Maintaining the original meaning and tone
Return only the improved content in HTML format.`;
        userPrompt = content;
        break;

      case "expand":
        systemPrompt = `You are a content writer. Expand the given content by:
- Adding more detail and examples
- Elaborating on key points
- Maintaining consistent tone
- Keeping it informative and engaging
Return only the expanded content in HTML format.`;
        userPrompt = content;
        break;

      case "simplify":
        systemPrompt = `You are a content editor. Simplify the given content by:
- Using simpler language
- Breaking down complex ideas
- Making it more accessible
- Keeping key information intact
Return only the simplified content in HTML format.`;
        userPrompt = content;
        break;

      case "generate-excerpt":
        systemPrompt = `You are a content summarizer. Create a compelling 2-3 sentence excerpt that:
- Captures the main point
- Entices readers to continue
- Is concise and clear
Return only the excerpt text, no HTML.`;
        userPrompt = content;
        break;

      case "seo-optimize":
        systemPrompt = `You are an SEO expert. Optimize the content for search engines by:
- Naturally incorporating relevant keywords
- Improving headings and structure
- Enhancing readability
- Maintaining quality and value
Return only the optimized content in HTML format.
${context ? `Focus keywords: ${context}` : ""}`;
        userPrompt = content;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Use GPT-4o-mini for fast, high-quality content generation
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const result = completion.choices[0].message.content || "";

    return NextResponse.json({ content: result });
  } catch (error: any) {
    console.error("Error processing content:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process content" },
      { status: 500 }
    );
  }
}
