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

    const { title, content, excerpt } = await request.json();

    if (!title && !content) {
      return NextResponse.json(
        { error: "Title or content is required" },
        { status: 400 }
      );
    }

    // Use GPT-4o-mini for cost-effective metadata generation
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an SEO expert. Generate optimized metadata for blog posts and pages.
Your response should be in JSON format with the following fields:
- metaTitle: Compelling title under 60 characters
- metaDescription: Engaging description under 160 characters
- metaKeywords: Comma-separated list of 5-8 relevant keywords
- suggestedExcerpt: Brief 2-3 sentence summary (only if no excerpt provided)

Focus on:
- Including primary keywords naturally
- Making titles and descriptions click-worthy
- Ensuring accuracy and relevance
- Avoiding keyword stuffing`,
        },
        {
          role: "user",
          content: `Title: ${title || "Untitled"}
${excerpt ? `Excerpt: ${excerpt}` : ""}

Content excerpt (first 1000 chars):
${content ? content.substring(0, 1000) : "No content provided"}

Generate SEO metadata for this content.`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const metadata = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json(metadata);
  } catch (error: any) {
    console.error("Error generating metadata:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate metadata" },
      { status: 500 }
    );
  }
}
