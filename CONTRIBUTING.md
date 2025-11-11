# Contributing to Freedom Aviation

Thank you for your interest in contributing to Freedom Aviation! This document provides guidelines and information for contributors.

## Code of Conduct

- Be respectful and professional
- Focus on constructive feedback
- Help maintain a welcoming environment
- Report any unacceptable behavior

## Getting Started

1. **Fork the repository** (if external contributor)
2. **Clone your fork**
   ```bash
   git clone <your-fork-url>
   cd FreedomAviation-1
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Set up development environment**
   - See `docs/development/getting-started.md`

## Development Workflow

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Use branch name prefixes:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

### Making Changes

1. **Write code** following our style guidelines
2. **Test thoroughly** - manual and automated
3. **Type check** - run `npm run check`
4. **Update documentation** if needed
5. **Commit with clear messages**

### Commit Message Format

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, semicolons, etc.)
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Build process, dependencies

**Examples:**
```
feat(auth): add Google OAuth sign-in

fix(dashboard): resolve aircraft not loading

docs(readme): update setup instructions

refactor(pricing): simplify tier calculation logic
```

### Submitting Changes

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Use clear, descriptive title
   - Describe what changed and why
   - Reference any related issues
   - Add screenshots for UI changes

3. **Respond to feedback**
   - Address review comments
   - Update PR as needed
   - Be open to suggestions

## Code Guidelines

### TypeScript

```typescript
// ✅ Good
interface UserProfile {
  id: string;
  email: string;
  fullName: string;
}

function getUserProfile(id: string): Promise<UserProfile> {
  // Implementation
}

// ❌ Avoid
function getUser(id: any): any {
  // Implementation
}
```

### React Components

```typescript
// ✅ Good - Functional component with typed props
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}

// ❌ Avoid - Untyped props
export function Button(props) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### Styling

Use Tailwind CSS utility classes:

```typescript
// ✅ Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-lg font-semibold">Title</h2>
</div>

// ❌ Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  <h2 style={{ fontSize: '18px' }}>Title</h2>
</div>
```

### API Routes

```typescript
// ✅ Good - Proper error handling and typing
app.get('/api/aircraft/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const aircraft = await getAircraft(id);
    
    if (!aircraft) {
      return res.status(404).json({ error: 'Aircraft not found' });
    }
    
    res.json(aircraft);
  } catch (error) {
    console.error('Error fetching aircraft:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ❌ Avoid - No error handling
app.get('/api/aircraft/:id', async (req, res) => {
  const aircraft = await getAircraft(req.params.id);
  res.json(aircraft);
});
```

## Database Changes

### Creating Migrations

1. **Update `supabase-schema.sql`** with changes
2. **Create migration script** in `scripts/`
   ```sql
   -- scripts/add-new-feature.sql
   
   -- Add new table
   CREATE TABLE IF NOT EXISTS public.new_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- Add RLS policies
   ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can view their own records"
     ON public.new_table
     FOR SELECT
     USING (auth.uid() = user_id);
   ```

3. **Update TypeScript types** in `shared/schema.ts`
4. **Document in** `docs/architecture/database-schema.md`

### RLS Policy Guidelines

Always enable RLS on new tables:

```sql
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- Owner access
CREATE POLICY "Owners can view their own data"
  ON public.your_table
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Admin access
CREATE POLICY "Admins can view all data"
  ON public.your_table
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

## Testing

### Manual Testing

Before submitting PR:
- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (responsive design)
- [ ] Test with different user roles
- [ ] Test error cases
- [ ] Verify no console errors

### Test User Roles

```sql
-- Create test users with different roles
UPDATE public.user_profiles SET role = 'owner' WHERE email = 'owner@test.com';
UPDATE public.user_profiles SET role = 'cfi' WHERE email = 'cfi@test.com';
UPDATE public.user_profiles SET role = 'admin' WHERE email = 'admin@test.com';
```

## Documentation

### When to Update Docs

- Adding new features
- Changing existing behavior
- Modifying APIs or database schema
- Updating setup or deployment processes

### Documentation Structure

```
docs/
├── setup/              # Setup and configuration guides
├── features/           # Feature-specific documentation
├── architecture/       # System architecture and design
└── development/        # Development guides
```

### Writing Good Documentation

- Use clear, concise language
- Include code examples
- Add troubleshooting sections
- Keep it up to date
- Use proper markdown formatting

## Review Process

### What Reviewers Look For

1. **Functionality** - Does it work as intended?
2. **Code Quality** - Is it clean and maintainable?
3. **TypeScript** - Proper typing and no `any`?
4. **Security** - No vulnerabilities introduced?
5. **Performance** - Efficient implementation?
6. **Tests** - Adequate testing coverage?
7. **Documentation** - Changes documented?

### Responding to Reviews

- Address all feedback
- Ask questions if unclear
- Make requested changes
- Re-request review when ready
- Be patient and professional

## Common Issues

### Type Errors

```bash
npm run check
```

Fix TypeScript errors before submitting PR.

### Import Errors

Use proper import paths:
```typescript
// ✅ Good
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

// ❌ Avoid relative imports outside component directory
import { Button } from '../../../components/ui/button';
```

### RLS Issues

If queries fail, check RLS policies:
```sql
-- View policies
\d+ table_name

-- Test as specific user
SET request.jwt.claims.sub = 'user-uuid';
```

## Security

### Never Commit

- API keys or secrets
- Database passwords
- OAuth client secrets
- Private keys
- User data

### Use Environment Variables

```typescript
// ✅ Good
const apiKey = process.env.STRIPE_SECRET_KEY;

// ❌ Never do this
const apiKey = 'sk_live_abc123...';
```

### Validate Input

```typescript
// ✅ Good
const email = req.body.email;
if (!email || !isValidEmail(email)) {
  return res.status(400).json({ error: 'Invalid email' });
}

// ❌ Avoid - No validation
const email = req.body.email;
await sendEmail(email);
```

## Questions?

If you have questions:
1. Check existing documentation in `docs/`
2. Review similar code in the codebase
3. Ask in pull request comments
4. Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

---

Thank you for contributing to Freedom Aviation! ✈️

