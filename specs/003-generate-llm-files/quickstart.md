# Quickstart: LLM-Friendly Data Exposure

**Feature**: LLM-Friendly Data Exposure  
**Branch**: `003-generate-llm-files`  
**Last Updated**: 2025-11-12

## What This Feature Does

Exposes website content in LLM-friendly formats through two text files:

- `/llms.txt` - Basic summary (~50-200KB)
- `/llms-full.txt` - Comprehensive data (~1-5MB)

These files make it easy for AI systems (ChatGPT, Claude, Gemini) to discover and reference accurate information about Cennso's services, content, and expertise.

## For Users

### Accessing LLM Data

**Via Footer Links**:

1. Scroll to website footer on any page
2. Look for "LLM Data (Basic)" and "LLM Data (Full)" links
3. Click to view or download the text files

**Via Direct URLs**:

- Basic: `https://www.cennso.com/llms.txt`
- Full: `https://www.cennso.com/llms-full.txt`

### Using with AI Systems

**ChatGPT/Claude/Gemini**:

1. Share the llms.txt URL with the AI system
2. Ask questions about Cennso services, blog posts, solutions, etc.
3. AI will use the structured data to provide accurate answers

**Example Prompts**:

- "Read https://www.cennso.com/llms.txt and tell me about Cennso's services"
- "What blog posts has Cennso published about 5G?"
- "Summarize Cennso's success stories"

## For Developers

### Prerequisites

- Node.js 18+ and Yarn installed
- Python 3.11+ for validation scripts
- Existing Cennso website repository cloned

### Quick Setup

1. **Install Dependencies** (if needed):

   ```bash
   yarn install
   pip install -r scripts/requirements.txt
   ```

2. **Generate LLM Files**:

   ```bash
   yarn generate:llm
   ```

   Output:
   - `public/llms.txt`
   - `public/llms-full.txt`

3. **Validate Generated Files**:

   ```bash
   yarn validate:llm
   ```

   Expected: All checks pass ✅

4. **Test Locally**:

   ```bash
   yarn dev
   ```

   Visit:
   - http://localhost:3000/llms.txt
   - http://localhost:3000/llms-full.txt

### Build Process

The generation happens automatically during build:

```bash
yarn build
```

**Steps**:

1. Runs `generate:llm` (via prebuild hook)
2. Generates llms.txt and llms-full.txt
3. Validates generated files
4. Continues with Next.js build
5. Files are deployed with static assets

### Development Workflow

#### Adding New Content

LLM files are regenerated automatically when you add:

- New blog posts → Appears in both files
- New solutions → Appears in both files
- New success stories → Appears in both files
- New job postings → Appears in llms-full.txt
- New team members → Appears in llms-full.txt

**No manual updates needed** - just run `yarn build`

#### Modifying Content

1. Edit source files (MDX, YAML)
2. Run `yarn generate:llm` to regenerate
3. Review changes in `public/llms.txt` and `public/llms-full.txt`
4. Validate with `yarn validate:llm`
5. Commit changes (source files only, not generated files)

#### Testing Changes

```bash
# Generate files
yarn generate:llm

# Validate
yarn validate:llm

# Test locally
yarn dev
open http://localhost:3000/llms.txt

# Run full quality check
yarn check:all
```

### File Structure

```
scripts/generate-llm-data/
├── index.ts              # Main orchestration
├── generators/
│   ├── basic.ts         # Generate llms.txt
│   ├── full.ts          # Generate llms-full.txt
│   └── shared.ts        # Shared utilities
└── tsconfig.json        # TypeScript config

scripts/
└── validate-llm-data.py # Validation script

public/
├── llms.txt              # Generated basic file
└── llms-full.txt         # Generated full file

content/
└── llm-links.yaml       # Footer link configuration

components/
└── Footer.tsx           # Renders footer links
```

### Common Commands

```bash
# Generate LLM files
yarn generate:llm

# Validate LLM files
yarn validate:llm

# Run all quality checks (includes LLM validation)
yarn check:all

# Build (includes generation)
yarn build

# Development server
yarn dev
```

### Configuration

#### Footer Links

Edit `content/llm-links.yaml`:

```yaml
llm_links:
  basic:
    label: 'LLM Data (Basic)'
    description: 'Lightweight website summary for AI systems'
   url: '/llms.txt'
  full:
    label: 'LLM Data (Full)'
    description: 'Comprehensive website content for AI systems'
   url: '/llms-full.txt'
```

#### Site URL

Update `siteMetadata.js` if site URL changes:

```javascript
module.exports = {
  siteUrl: 'https://www.cennso.com',
  // ...
}
```

### Troubleshooting

#### "OG images directory not found"

**Problem**: Generation script can't find content directories

**Solution**:

```bash
# Ensure you're in project root
cd /path/to/cennso-website

# Verify content exists
ls content/

# Run from correct directory
yarn generate:llm
```

#### "Validation failed: missing metadata"

**Problem**: Generated file missing required metadata headers

**Solution**:

1. Check `siteMetadata.js` has `siteUrl` defined
2. Verify generation script completed successfully
3. Re-generate: `yarn generate:llm`

#### "File size exceeds limit"

**Problem**: llms-full.txt > 20MB

**Solution**:

1. Check for very large blog posts
2. Review content duplication
3. Consider excluding certain content types
4. Adjust size limit in validation script if legitimate

#### "HTML tags found in output"

**Problem**: Text cleaning didn't remove all HTML/JSX

**Solution**:

1. Check which content has HTML
2. Improve text cleaning in `generators/shared.ts`
3. Add test cases for problematic patterns

#### Footer links not visible

**Problem**: Links don't appear in footer

**Solution**:

1. Verify `content/llm-links.yaml` exists
2. Check Footer.tsx updated correctly
3. Restart dev server: `yarn dev`
4. Clear browser cache

### CI/CD Integration

The feature runs automatically in GitHub Actions:

**Workflow**: `.github/workflows/tests-and-other-validation.yml`

**Steps**:

1. Checkout code
2. Install dependencies
3. Run `yarn build` (includes LLM generation)
4. Run `yarn validate:llm`
5. Fail PR if validation errors

**Local Testing Before Push**:

```bash
# Simulate CI workflow
yarn check:all

# Expected result: All checks pass ✅
```

## For Content Creators

### What Gets Included

**llms.txt (Basic)**:

- Company description
- Services overview
- Contact information
- 5-10 most recent blog posts (titles + summaries)
- Solutions list
- Success stories list
- Key page links

**llms-full.txt (Comprehensive)**:

- Everything from llms.txt
- ALL blog posts with full content
- ALL solutions with full descriptions
- ALL success stories with full case studies
- Team member bios
- Job postings with full descriptions
- Customer testimonials
- Partner information

### Content Guidelines

#### Writing for LLMs

1. **Clear Titles**: Use descriptive, standalone titles
   - ✅ "5G Core Network Architecture Explained"
   - ❌ "This Changes Everything"

2. **Good Summaries**: Write excerpts that make sense without context
   - ✅ "This article explains the key components of 5G core networks and how they enable next-generation mobile services."
   - ❌ "Read on to learn more about this exciting topic."

3. **Absolute Links**: Use full URLs in content when possible
   - ✅ "Learn more at https://www.cennso.com/solutions/5g-core"
   - ❌ "Learn more here" (with relative link)

4. **Avoid Formatting Dependencies**: Content should make sense as plain text
   - ✅ Use bullet points for lists
   - ❌ Rely on tables or complex layouts

#### Content Quality Checks

Before publishing, verify:

- [ ] Title is descriptive (50-80 characters)
- [ ] Excerpt summarizes content (150-250 characters)
- [ ] Author information complete
- [ ] Publication date set
- [ ] Content readable without images/formatting
- [ ] Links use descriptive text
- [ ] Technical terms explained on first use

### Impact of Content Changes

| Change             | Impact on LLM Files      | Regeneration Needed |
| ------------------ | ------------------------ | ------------------- |
| New blog post      | Appears in both files    | Automatic on build  |
| Edit blog post     | Updated in both files    | Automatic on build  |
| Delete blog post   | Removed from both files  | Automatic on build  |
| New solution       | Appears in both files    | Automatic on build  |
| New job posting    | Appears in llms-full.txt | Automatic on build  |
| Update author info | Updated in all posts     | Automatic on build  |
| Add testimonial    | Appears in llms-full.txt | Automatic on build  |

**No manual steps required** - just publish content normally!

## Resources

- **File Format Spec**: `specs/003-generate-llm-files/contracts/llms-txt-format.txt`
- **Data Model**: `specs/003-generate-llm-files/data-model.md`
- **Research**: `specs/003-generate-llm-files/research.md`
- **llms.txt Standard**: https://llmstxt.org/

## Getting Help

**Common Questions**:

- How do I test my content in ChatGPT? → Share llms.txt URL with ChatGPT
- Can I customize what's included? → Edit generation scripts in `scripts/generate-llm-data/`
- How often are files updated? → On every deployment (every `yarn build`)
- Can I download historical versions? → No, files are regenerated each build

**Support**:

- Issues: GitHub repository issues
- Documentation: `/docs/llm-data-format.md` (created in P3)
- Code: `scripts/generate-llm-data/` directory

## Next Steps

1. ✅ Review file format specification
2. ✅ Understand data model
3. ⬜ Implement generation scripts (Phase 2)
4. ⬜ Implement validation script (Phase 2)
5. ⬜ Update Footer component (Phase 2)
6. ⬜ Test end-to-end (Phase 2)
7. ⬜ Deploy to production (Phase 2)

---

**Quick Reference**:

- Generate: `yarn generate:llm`
- Validate: `yarn validate:llm`
- Check: All `yarn check:all`
- Basic file: `/llms.txt`
- Full file: `/llms-full.txt`
