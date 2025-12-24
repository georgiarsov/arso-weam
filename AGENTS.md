# AGENTS.md - Coding Guidelines for Weam AI

This document provides comprehensive guidelines for AI coding agents working on the Weam AI codebase.

## Project Overview

Weam AI is a production-ready AI platform with:
- **Frontend**: Next.js 14 (App Router) with TypeScript, React 18, TailwindCSS
- **Backend**: Node.js with Express, MongoDB, Redis, Socket.io
- **Architecture**: Monorepo with `nextjs/` and `nodejs/` directories

## Build, Lint & Test Commands

### Next.js Frontend (nextjs/)

```bash
# Development
cd nextjs
npm run dev              # Start dev server on port 3000
npm run dev:dev          # Start dev server on port 3001

# Production
npm run build            # Build for production
npm start                # Start production server
npm run clean-build      # Clean cache and rebuild

# Code Quality
npm run lint             # Run ESLint
```

**Note**: No test suite configured for frontend yet.

### Node.js Backend (nodejs/)

```bash
# Development
cd nodejs
npm start                # Start server (production mode)
npm run dev              # Start with nodemon (watch mode)
npm run dev:two          # Start with NODE_ENV=two

# Testing (Jest)
npm test                 # Run all tests (currently no tests configured)

# Ollama Integration
npm run setup-ollama     # Setup Ollama (Mac/Linux)
npm run setup-ollama-win # Setup Ollama (Windows)
npm run test-ollama      # Test local Ollama connection
```

**Running a Single Test**: Use Jest's pattern matching:
```bash
cd nodejs
npx jest path/to/test-file.test.js
npx jest -t "test name pattern"
```

### Docker Compose

```bash
# Full stack
docker-compose up --build
docker-compose down

# Ollama integration
docker-compose -f docker-compose.ollama.yml up
```

## Code Style Guidelines

### Import Organization

Order imports logically:
1. React/Next.js core
2. Third-party libraries
3. Internal utilities (`@/utils/*`)
4. Actions and API (`@/actions/*`, `@/api`)
5. Types and schemas (`@/types/*`, `@/schema/*`)
6. Components (`@/components/*`, `@/widgets/*`)
7. Icons (`@/icons/*`)
8. Redux store (`@/lib/*`)

```typescript
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { formatDate } from '@/utils/common';
import { getChatAction } from '@/actions/chat';
import { ChatType } from '@/types/chat';
import Header from '@/components/Header/Header';
import { useDispatch } from 'react-redux';
```

### TypeScript Configuration

- **Strict mode**: Disabled (transitioning)
- **noImplicitAny**: false (legacy - avoid `any` in new code)
- **Path aliases**: Use `@/*` for `src/*`
- **Target**: ESNext with module bundler resolution

### Formatting

- **Indentation**: 4 spaces
- **Quotes**: Single quotes for strings, double for JSX attributes
- **Semicolons**: Required
- **Line length**: No strict limit, but keep readable
- **TailwindCSS**: Use utility classes, custom colors (b1-b15, w1-w14)

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Header`, `ChatTitleBar` |
| Files | Match component name | `Header.tsx`, `ChatTitleBar.tsx` |
| Hooks | camelCase with `use` prefix | `useChat`, `useServerAction` |
| Actions | camelCase with `Action` suffix | `loginAction`, `getChatListAction` |
| Types | PascalCase with `Type` suffix | `ChatListType`, `UserType` |
| Enums | PascalCase with `Enum` suffix | `RoleEnum`, `StatusEnum` |
| Constants | SCREAMING_SNAKE_CASE | `MODULE_ACTIONS`, `RESPONSE_STATUS` |
| Functions | camelCase | `formatDate`, `handleSubmit` |
| Variables | camelCase | `chatList`, `isLoading` |

### Component Structure

```typescript
'use client'; // Only for client components

import statements...

// Type definitions
type ComponentProps = {
    userId: string;
    onSuccess?: () => void;
};

// Component definition
export default function ComponentName({ userId, onSuccess }: ComponentProps) {
    // 1. Hooks (useState, useEffect, custom hooks)
    const [data, setData] = useState<DataType[]>([]);
    const { isLoading } = useCustomHook();
    
    // 2. Helper functions/handlers
    const handleClick = () => {
        // implementation
    };
    
    // 3. Effects
    useEffect(() => {
        // side effects
    }, []);
    
    // 4. JSX return
    return (
        <div className="container">
            {/* content */}
        </div>
    );
}
```

### Error Handling

**Client-Side**:
```typescript
try {
    const response = await commonApi({ /* config */ });
    if (response.code === RESPONSE_CODE.SUCCESS) {
        Toast('Success!', 'success');
    }
} catch (error) {
    console.error('Error:', error);
    Toast('An error occurred', 'error');
}
```

**Server Actions**:
```typescript
'use server';
export const fetchDataAction = async (params: ParamsType) => {
    try {
        const response = await serverApi({ /* config */ });
        return response;
    } catch (error) {
        return { code: RESPONSE_CODE.ERROR, message: 'Failed' };
    }
};
```

**Never throw unhandled errors** - always catch and show user-friendly messages.

### API Patterns

**Client API** (`@/api/index.ts`):
```typescript
const response = await commonApi({
    action: MODULE_ACTIONS.LIST,
    prefix: MODULE_ACTIONS.WEB_PREFIX,
    module: MODULES.CHAT,
    common: true,
    data: { /* payload */ },
});
```

**Server Actions** (`@/actions/*.ts`):
```typescript
'use server';
export const getDataAction = async (filter: FilterType) => {
    const response = await serverApi({
        action: MODULE_ACTIONS.LIST,
        module: MODULES.CHAT,
        data: filter,
    });
    return response;
};
```

### State Management (Redux Toolkit)

**Define Slice**:
```typescript
const featureSlice = createSlice({
    name: 'feature',
    initialState: { data: [], isLoading: false },
    reducers: {
        setDataAction: (state, action) => {
            state.data = action.payload;
        },
    },
});

export const { setDataAction } = featureSlice.actions;
export default featureSlice.reducer;
```

**Usage**:
```typescript
const dispatch = useDispatch();
const data = useSelector((store: RootState) => store.feature.data);

dispatch(setDataAction(newData));
```

## Key Principles

1. **Always use TypeScript** - Avoid `any`, prefer explicit types
2. **Use path aliases** - Import with `@/` not relative paths
3. **Client vs Server Components** - Mark client components with `'use client'`
4. **Error boundaries** - Use for graceful degradation
5. **Loading states** - Show feedback for async operations
6. **Toast notifications** - Use centralized `Toast()` utility
7. **Validation** - Use Yup schemas for forms
8. **Constants** - Never hardcode values, use constants from `utils/constant.ts`
9. **Utilities** - Reuse helpers from `utils/common.tsx` and `utils/helper.ts`
10. **Security** - Always encrypt sensitive data, check authentication

## Contributing Guidelines

- Feature requests require prior approval (see `.github/CONTRIBUTING.md`)
- Small changes/bug fixes should be tied to GitHub issues
- Join [Discord](https://discord.gg/qhuPkhWh) for discussions
- Follow the established patterns and conventions
- Write clear commit messages
- Test changes locally before submitting PRs

## Resources

- [Documentation](https://docs.weam.ai)
- [Discord Community](https://discord.gg/qhuPkhWh)
- [GitHub Issues](https://github.com/weam-ai/weam/issues)
