# Content Management System

## Overview

This document describes the CMS features added to the TapWaterRating dashboard for managing blog posts, pages, categories, and tags.

## Database Schema

### Categories

- Hierarchical structure (parent/child support)
- Slug-based URLs
- Order field for custom sorting
- Active/inactive status

### Tags

- Simple tagging system
- Color-coded for visual organization
- Many-to-many relationship with posts

### Posts/Pages

- Unified content type (post vs page)
- Draft/Published/Archived status
- Rich text editor (Tiptap)
- SEO metadata (title, description, keywords)
- Featured images
- View counter
- Author tracking
- Category assignment
- Tag assignment (many-to-many)

## Recommended Packages

### WYSIWYG Editor: **Tiptap**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder @tiptap/extension-text-align @tiptap/extension-color @tiptap/extension-text-style
```

**Why Tiptap:**

- Modern, headless, and extensible
- Built on ProseMirror (robust foundation)
- TypeScript-first
- Great React support
- Notion-like editing experience
- Customizable toolbar and extensions
- Clean JSON/HTML output
- Active development and community

**Alternatives considered:**

- Novel (built on Tiptap, but more opinionated)
- Lexical (Meta's framework, newer but less mature ecosystem)
- Slate (older, less maintained)

### Additional Utilities

```bash
npm install slugify dompurify @types/dompurify
```

- `slugify`: Generate URL-friendly slugs from titles
- `dompurify`: Sanitize HTML content for security

## Implementation Plan

1. **Database Migration**

   - Run `npm run db:generate` to create migration files
   - Run `npm run db:push` to apply schema changes

2. **Dashboard Pages to Create**

   - `/dashboard/content/posts` - List all posts/pages
   - `/dashboard/content/posts/new` - Create new post
   - `/dashboard/content/posts/[id]` - Edit post
   - `/dashboard/content/categories` - Manage categories
   - `/dashboard/content/tags` - Manage tags

3. **API Routes to Create**

   - `/api/content/posts` - CRUD for posts
   - `/api/content/categories` - CRUD for categories
   - `/api/content/tags` - CRUD for tags

4. **Components to Build**
   - `TiptapEditor` - Rich text editor wrapper
   - `CategoryManager` - Tree view for hierarchical categories
   - `TagManager` - Tag CRUD with color picker
   - `PostEditor` - Full post editing interface with sidebar
   - `MediaUploader` - Image upload for featured images

## Features

### Post Editor Features

- Rich text editing (headings, bold, italic, lists, links, images)
- Auto-save drafts
- Preview mode
- SEO metadata fields
- Category selection
- Tag management (create inline)
- Featured image upload
- Publish/schedule
- Slug customization

### Category Manager Features

- Hierarchical tree view
- Drag-and-drop ordering
- Bulk activate/deactivate
- Delete with reassignment option

### Tag Manager Features

- Color picker for visual organization
- Bulk operations
- Usage count
- Merge tags

## Usage Example

```typescript
// Example: Creating a post
const post = await db.insert(posts).values({
  id: nanoid(),
  title: "How to Check Water Quality",
  slug: "how-to-check-water-quality",
  content: "<p>Content here...</p>",
  contentJson: JSON.stringify(editorState),
  type: "post",
  status: "published",
  authorId: session.user.id,
  categoryId: "water-guides",
  publishedAt: new Date(),
});

// Add tags
await db.insert(postTags).values([
  { postId: post.id, tagId: "safety" },
  { postId: post.id, tagId: "guides" },
]);
```

## Next Steps

1. Install Tiptap packages
2. Generate and apply database migration
3. Create basic API routes
4. Build Tiptap editor component
5. Create category/tag management UIs
6. Build post editor interface
7. Add to dashboard navigation menu
