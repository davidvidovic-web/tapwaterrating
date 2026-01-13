# AI Features Documentation

## Overview

This application includes AI-powered content generation and optimization features using OpenAI's ChatGPT API.

## Models Used

### GPT-4o-mini
**Used for**: All AI features (metadata, content generation, and improvement)
- **Why**: Fast, cost-effective, and universally available while maintaining excellent quality
- **Speed**: Very fast (1-5 seconds for most operations)
- **Cost**: Highly affordable (~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens)
- **Use Cases**:
  - SEO meta titles (under 60 characters)
  - Meta descriptions (under 160 characters)
  - Meta keywords (5-8 relevant keywords)
  - Content excerpts (2-3 sentences)
  - Full content generation from prompts
  - Content improvement and editing
  - Content expansion and elaboration
  - Content simplification
  - SEO optimization

**Note**: We use GPT-4o-mini for all operations because it provides excellent quality at a fraction of the cost. If you have access to GPT-4o or newer models (GPT-4.1, GPT-5 series), you can upgrade by modifying the model name in the API route files.

## Setup

1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Add to your `.env` file:
   ```bash
   OPENAI_API_KEY=sk-your-api-key-here
   ```
3. Restart your development server

## Features

### 1. Auto-Generate Metadata
**Location**: Post/Page Editor → SEO Meta section

**What it does**:
- Analyzes your title and content
- Generates SEO-optimized meta title
- Creates compelling meta description
- Suggests relevant keywords
- Optionally generates excerpt if missing

**How to use**:
1. Write your title and content
2. Click "AI Generate" in SEO Meta section
3. Review and edit generated metadata as needed

**API Route**: `/api/ai/generate-metadata`

---

### 2. AI Generate Content
**Location**: New Post → Content Editor

**What it does**:
- Creates full blog post or page content from a prompt
- Includes proper HTML structure
- SEO-friendly formatting
- Engaging and informative style

**How to use**:
1. Add a title for your post/page
2. Click "AI Generate" in Content section
3. Enter a detailed prompt describing what you want
4. AI generates complete content

**API Route**: `/api/ai/generate-content`

---

### 3. Improve Content
**Location**: Content Editor

**What it does**:
- Enhances clarity and readability
- Fixes grammar and spelling
- Improves flow and structure
- Maintains original meaning

**How to use**:
1. Write or paste content
2. Click "Improve" button
3. AI enhances your content

**API Route**: `/api/ai/improve-content`

---

### 4. Expand Content
**Location**: Content Editor

**What it does**:
- Adds more detail and examples
- Elaborates on key points
- Keeps consistent tone
- Makes content more comprehensive

**How to use**:
1. Write initial content
2. Click "Expand" button
3. AI adds depth to your content

**API Route**: `/api/ai/improve-content`

---

### 5. SEO Optimize
**Location**: Content Editor

**What it does**:
- Naturally incorporates relevant keywords
- Improves headings and structure
- Enhances readability for search engines
- Maintains quality and value

**How to use**:
1. Add meta keywords (optional but recommended)
2. Write your content
3. Click "SEO" button
4. AI optimizes for search engines

**API Route**: `/api/ai/improve-content`

---

### 6. Generate Excerpt
**Location**: Excerpt section

**What it does**:
- Creates compelling 2-3 sentence summary
- Captures main point
- Entices readers to continue
- Clear and concise

**How to use**:
1. Write your content
2. Click "Generate" in Excerpt section
3. AI creates summary

**API Route**: `/api/ai/improve-content`

## API Routes

### POST /api/ai/generate-metadata
Generates SEO metadata from title and content.

**Request Body**:
```json
{
  "title": "Post title",
  "content": "Post content (HTML)",
  "excerpt": "Optional existing excerpt"
}
```

**Response**:
```json
{
  "metaTitle": "SEO-optimized title under 60 chars",
  "metaDescription": "Engaging description under 160 chars",
  "metaKeywords": "keyword1, keyword2, keyword3",
  "suggestedExcerpt": "Brief 2-3 sentence summary"
}
```

---

### POST /api/ai/improve-content
Improves, expands, simplifies, or optimizes content.

**Request Body**:
```json
{
  "content": "Content to process (HTML)",
  "action": "improve|expand|simplify|generate-excerpt|seo-optimize",
  "context": "Optional keywords for SEO optimization"
}
```

**Response**:
```json
{
  "content": "Processed content (HTML or text for excerpt)"
}
```

---

### POST /api/ai/generate-content
Generates new content from a prompt.

**Request Body**:
```json
{
  "prompt": "Description of what to write",
  "context": "Optional additional context"
}
```

**Response**:
```json
{
  "content": "Generated content (HTML)"
}
```

## Cost Considerations

### GPT-4o-mini
- **Cost**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Typical metadata generation**: ~500 input + 200 output tokens = ~$0.0002 per request
- **Typical content generation**: ~1000 input + 2000 output tokens = ~$0.0027 per request
- **Recommendation**: Excellent for frequent use - very affordable!

### Upgrading to Newer Models
If you have access to more advanced models, you can upgrade:
- **GPT-4.1**: Smartest non-reasoning model (~$2.50/$10 per 1M tokens)
- **GPT-5 mini**: Faster version of GPT-5 (~$1/$4 per 1M tokens)
- **GPT-5**: Advanced reasoning model (~$5/$15 per 1M tokens)
GPT-4o-mini is already very affordable - use freely!
2. Use content generation as starting point, then edit
3. Review AI outputs before regenerating
4. Combine multiple edits before applying AI improvements
5. Metadata generation costs less than $0.001 per use

### Tips to Reduce Costs:
1. Use metadata generation frequently (very cheap)
2. Use content generation as starting point, then edit
3. Review AI outputs before regenerating
4. Combine multiple edits before applying AI improvements
5. Set reasonable `max_tokens` limits in API calls

## Best Practices

1. **Review AI outputs**: Always review and edit AI-generated content
2. **Provide context**: Better prompts = better results
3. **Iterative approach**: Generate → Review → Improve → Finalize
4. **Use keywords**: Add meta keywords before SEO optimization
5. **Save drafts**: AI content as starting point, not final product

## Limitations

- AI may occasionally generate inaccurate information
- Always fact-check important claims
- AI style may need adjustment for brand voice
- Image generation not included (use URLs)
- Rate limits apply based on OpenAI tier

## Security

- API key stored securely in environment variables
- All AI features require authentication
- Only admin/editor users can access
- API routes protected by NextAuth

## Troubleshooting

**"Failed to generate metadata. Please check your API key."**
- Verify `OPENAI_API_KEY` in `.env`
- Check API key is valid at platform.openai.com
- Ensure you have credits in your OpenAI account

**AI responses are slow**
- GPT-4o-mini is very fast (1-5 seconds typically)
- Network latency may add delay
- Content generation with 4000 max tokens may take 5-10 seconds

**Content not formatted correctly**
- AI outputs HTML - may need adjustment
- TipTap editor should handle most formatting
- Manual editing may be needed for complex layouts

## Future Enhancements

Potential additions:
- [ ] Image generation with DALL-E
- [ ] Bulk metadata generation for existing posts
- [ ] Content tone/style customization
- [ ] Multi-language support
- [ ] Content suggestions based on trends
- [ ] Auto-tagging based on content analysis
- [ ] Readability scoring
