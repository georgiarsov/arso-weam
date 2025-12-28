# LangChain Stack Upgrade Plan v1.0

**Project:** Weam AI  
**Created:** December 28, 2025  
**Target:** Upgrade from LangChain v0.3.x to v1.x  
**Estimated Duration:** 2-3 weeks  
**Risk Level:** HIGH (Major version upgrade with breaking changes)

---

## Executive Summary

This document provides a comprehensive, agent-friendly plan to upgrade the entire LangChain stack in the Weam AI project from v0.3.x to v1.x. The upgrade enables access to latest features including improved Gemini integration, model profiles, middleware system, and enhanced structured output capabilities.

### Current State

| Package | Current Version | Target Version | Breaking Changes |
|---------|----------------|----------------|------------------|
| `@langchain/core` | 0.3.78 | 1.1.8 | ✅ Yes - Major API changes |
| `@langchain/openai` | 0.6.14 | 1.2.0 | ✅ Yes - New tool strategies |
| `@langchain/anthropic` | 0.3.30 | 1.3.3 | ✅ Yes - Tool APIs changed |
| `@langchain/google-genai` | 0.2.18 | 2.1.3 | ⚠️ Moderate - Message format changes |
| `@langchain/langgraph` | 0.4.9 | 1.0.7 | ✅ Yes - StateGraph API changes |
| `@langchain/mcp-adapters` | 0.6.0 | 1.1.1 | ⚠️ Moderate - Typed interrupts |
| `@langchain/textsplitters` | 0.1.0 | 1.0.1 | ❌ No - Minor version bump |
| `langchain` | 0.3.35 | 1.2.3 | ✅ Yes - Package restructure |

### Impact Analysis

**Files Affected:** 14 files in `nodejs/src/`

| Priority | File | Packages Used | Risk Level |
|----------|------|---------------|------------|
| 🔴 CRITICAL | `services/langgraph.js` | 6 packages | HIGH |
| 🔴 CRITICAL | `services/memoryService.js` | 3 packages | HIGH |
| 🟡 HIGH | `services/thread.js` | 2 packages | MEDIUM |
| 🟡 HIGH | `services/importChatProcessor*.js` | 3 packages | MEDIUM |
| 🟢 MEDIUM | `services/embeddings.js` | 1 package | LOW |
| 🟢 MEDIUM | `services/upload*.js` | 1 package | LOW |
| 🟢 MEDIUM | `services/customgpt.js` | 1 package | LOW |
| 🟢 MEDIUM | Tool files | 1 package | LOW |

---

## Pre-Flight Checklist

Before starting the upgrade, ensure:

- [ ] All team members are aware of the planned upgrade
- [ ] Current production is stable with no critical bugs
- [ ] Full test suite passes on current version
- [ ] Database backup completed
- [ ] Git branch created: `feature/langchain-v1-upgrade`
- [ ] Node.js version is 20.x or higher (v1 requirement)
- [ ] Development environment is available for testing
- [ ] Rollback plan is documented

---

## Phase 1: Environment Preparation

**Duration:** 1 day  
**Risk:** LOW  
**Prerequisites:** None

### Tasks

#### 1.1 Verify Node.js Version
```bash
# Check Node.js version (must be 20+)
node --version

# If < 20, upgrade Node.js
# macOS with Homebrew:
brew install node@20

# Or use nvm:
nvm install 20
nvm use 20
```

**Verification:**
```bash
node --version  # Should output v20.x.x or higher
```

#### 1.2 Create Feature Branch
```bash
git checkout -b feature/langchain-v1-upgrade
git push -u origin feature/langchain-v1-upgrade
```

**Verification:**
```bash
git branch --show-current  # Should output: feature/langchain-v1-upgrade
```

#### 1.3 Document Current State
```bash
cd nodejs
npm list @langchain/core @langchain/openai @langchain/anthropic > ../pre-upgrade-versions.txt
npm test > ../pre-upgrade-tests.txt 2>&1 || true
```

**Verification:**
- [ ] `pre-upgrade-versions.txt` created
- [ ] `pre-upgrade-tests.txt` created
- [ ] Files committed to branch

#### 1.4 Create Backup
```bash
# Backup package files
cp nodejs/package.json nodejs/package.json.backup
cp nodejs/package-lock.json nodejs/package-lock.json.backup
cp nodejs/pnpm-lock.yaml nodejs/pnpm-lock.yaml.backup

# Commit backups
git add nodejs/*.backup
git commit -m "chore: backup package files before langchain v1 upgrade"
```

**Verification:**
- [ ] Backup files created
- [ ] Backup files committed

---

## Phase 2: Package Updates

**Duration:** 1-2 hours  
**Risk:** MEDIUM  
**Prerequisites:** Phase 1 complete

### Tasks

#### 2.1 Update Core Package
```bash
cd nodejs
npm install @langchain/core@1.1.8 --save --legacy-peer-deps
```

**Verification:**
```bash
npm list @langchain/core
# Should show: @langchain/core@1.1.8
```

#### 2.2 Update Provider Packages
```bash
npm install @langchain/openai@1.2.0 --save --legacy-peer-deps
npm install @langchain/anthropic@1.3.3 --save --legacy-peer-deps
npm install @langchain/google-genai@2.1.3 --save --legacy-peer-deps
```

**Verification:**
```bash
npm list | grep @langchain
# Verify all versions match target versions
```

#### 2.3 Update LangGraph
```bash
npm install @langchain/langgraph@1.0.7 --save --legacy-peer-deps
```

**Verification:**
```bash
npm list @langchain/langgraph
# Should show: @langchain/langgraph@1.0.7
```

#### 2.4 Update Supporting Packages
```bash
npm install @langchain/mcp-adapters@1.1.1 --save --legacy-peer-deps
npm install @langchain/textsplitters@1.0.1 --save --legacy-peer-deps
npm install langchain@1.2.3 --save --legacy-peer-deps
```

**Verification:**
```bash
npm list @langchain/mcp-adapters @langchain/textsplitters langchain
# Verify all versions match targets
```

#### 2.5 Install @langchain/classic (for legacy functionality)
```bash
npm install @langchain/classic --save --legacy-peer-deps
```

**Verification:**
```bash
npm list @langchain/classic
# Should show latest version installed
```

#### 2.6 Rebuild Dependencies
```bash
rm -rf node_modules
npm install --legacy-peer-deps
npm rebuild bcrypt --build-from-source
```

**Verification:**
```bash
ls node_modules/@langchain/core/package.json
# File should exist
cat node_modules/@langchain/core/package.json | grep '"version"'
# Should show "version": "1.1.8"
```

#### 2.7 Commit Package Updates
```bash
git add package.json package-lock.json
git commit -m "chore: upgrade langchain packages to v1.x"
```

**Verification:**
- [ ] Changes committed successfully
- [ ] No uncommitted changes to package files

---

## Phase 3: Code Migration - Memory Service

**Duration:** 2-3 hours  
**Risk:** HIGH  
**Prerequisites:** Phase 2 complete  
**File:** `nodejs/src/services/memoryService.js`

### Critical Changes Needed

#### 3.1 Replace ConversationSummaryBufferMemory

**Issue:** `ConversationSummaryBufferMemory` moved to `@langchain/classic`

**Current Code (line 1):**
```javascript
const { ConversationSummaryBufferMemory } = require('langchain/memory');
```

**New Code:**
```javascript
const { ConversationSummaryBufferMemory } = require('@langchain/classic/memory');
```

**Task Checklist:**
- [ ] Update import statement in `memoryService.js`
- [ ] Test memory initialization
- [ ] Test memory saving/loading
- [ ] Test memory pruning

**Verification:**
```bash
cd nodejs
node -e "const { ConversationSummaryBufferMemory } = require('@langchain/classic/memory'); console.log('Import successful');"
```

#### 3.2 Update Message Handling

**Issue:** Messages now have `contentBlocks` property in v1

**Current Pattern:**
```javascript
formattedMessages.push(new HumanMessage(humanContent));
```

**Enhanced Pattern (optional for multimodal support):**
```javascript
// For text-only (no change needed):
formattedMessages.push(new HumanMessage(humanContent));

// For multimodal content (future enhancement):
formattedMessages.push(new HumanMessage({
    contentBlocks: [
        { type: 'text', text: humanContent }
    ]
}));
```

**Task Checklist:**
- [ ] Review message creation in `MongoDBChatMessageHistory.getMessages()`
- [ ] Ensure compatibility with v1 message format
- [ ] Test message serialization/deserialization
- [ ] Document multimodal support for future enhancement

**Verification:**
- [ ] Existing test suite passes
- [ ] Manual test: Create and retrieve conversation history
- [ ] Manual test: Test with encrypted messages

---

## Phase 4: Code Migration - LangGraph Service

**Duration:** 4-6 hours  
**Risk:** CRITICAL  
**Prerequisites:** Phase 3 complete  
**File:** `nodejs/src/services/langgraph.js`

### Critical Changes Needed

#### 4.1 Review StateGraph API Changes

**Issue:** LangGraph v1 has API changes for StateGraph initialization

**Current Code (line 2):**
```javascript
const { StateGraph, END } = require('@langchain/langgraph');
```

**Action Required:**
- Review if custom state schemas are compatible
- Check if interrupt handling needs updates
- Verify graph compilation works

**Task Checklist:**
- [ ] Review StateGraph initialization code
- [ ] Test graph compilation
- [ ] Test streaming with new event encoding
- [ ] Verify interrupt handling (if used)

**Verification:**
```bash
# Run test to compile graph
node -e "
const { StateGraph, END } = require('@langchain/langgraph');
const graph = new StateGraph({ messages: [] });
graph.addNode('test', (state) => state);
graph.setEntryPoint('test');
graph.addEdge('test', END);
const compiled = graph.compile();
console.log('StateGraph compilation successful');
"
```

#### 4.2 Update Model Invocation

**Issue:** Chat model APIs may have changed

**Current Code (line 451):**
```javascript
const response = await model.invoke(context);
```

**Action Required:**
- Ensure context messages are proper LangChain objects (already fixed in previous bugfix)
- Verify structured output compatibility
- Test with all providers (OpenAI, Anthropic, Gemini)

**Task Checklist:**
- [ ] Test model invocation with OpenAI
- [ ] Test model invocation with Anthropic
- [ ] Test model invocation with Gemini
- [ ] Verify message format compatibility

**Verification:**
```bash
# Run existing Gemini test
cd nodejs
node test-gemini-api.js YOUR_GOOGLE_API_KEY

# Expected: Success message with valid response
```

#### 4.3 Update Tool Handling

**Issue:** Tool binding and error handling may have changed

**Action Required:**
- Review tool binding in model initialization
- Check tool error handling patterns
- Verify tool response format

**Task Checklist:**
- [ ] Review tool binding code
- [ ] Test tool execution
- [ ] Test tool error scenarios
- [ ] Verify tool results are properly formatted

**Verification:**
- [ ] Manual test: Invoke agent with tool call
- [ ] Manual test: Trigger tool error
- [ ] Verify error handling works correctly

#### 4.4 Update Streaming Implementation

**Issue:** `toLangGraphEventStream` removed in v1

**Current Pattern (if used):**
```javascript
const stream = await app.streamEvents(inputs, {
    streamMode: 'messages',
    version: 'v2',
});
```

**New Pattern:**
```javascript
// If streaming to HTTP response:
const stream = await graph.stream(input, {
    encoding: 'text/event-stream',
    streamMode: ['values', 'messages'],
});

return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
});
```

**Task Checklist:**
- [ ] Identify streaming code in langgraph.js
- [ ] Update to new streaming API (if applicable)
- [ ] Test streaming responses
- [ ] Verify SSE format compatibility with frontend

**Verification:**
- [ ] Manual test: Start a streaming chat session
- [ ] Verify frontend receives chunks correctly
- [ ] Check browser network tab for proper SSE format

---

## Phase 5: Code Migration - Import Chat Processors

**Duration:** 2-3 hours  
**Risk:** MEDIUM  
**Prerequisites:** Phase 4 complete  
**Files:** 
- `nodejs/src/services/importChatProcessor.js`
- `nodejs/src/services/importChatProcessorAnthropic.js`

### Critical Changes Needed

#### 5.1 Update Model Imports

**Current Code:**
```javascript
const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');
```

**Action Required:**
- Verify import paths remain valid in v1
- Check for API changes in chat model constructors

**Task Checklist:**
- [ ] Test ChatOpenAI initialization
- [ ] Test ChatAnthropic initialization
- [ ] Verify model parameters are valid
- [ ] Test model invocation

**Verification:**
```bash
node -e "
const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');
console.log('Imports successful');
"
```

#### 5.2 Update Message Handling

**Action Required:**
- Ensure message creation uses v1-compatible format
- Test message serialization for import/export

**Task Checklist:**
- [ ] Review message creation code
- [ ] Test chat import functionality
- [ ] Test chat export functionality
- [ ] Verify message format compatibility

**Verification:**
- [ ] Manual test: Import chat conversation
- [ ] Manual test: Export chat conversation
- [ ] Verify data integrity

---

## Phase 6: Code Migration - Tools and Utilities

**Duration:** 2-3 hours  
**Risk:** LOW  
**Prerequisites:** Phase 5 complete  
**Files:** 
- `nodejs/src/services/searchTool.js`
- `nodejs/src/services/imageTool.js`
- `nodejs/src/services/geminiImageTool.js`
- `nodejs/src/services/promptWebScraper.js`
- `nodejs/src/services/mcpService.js`

### Critical Changes Needed

#### 6.1 Update Tool Imports

**Current Code:**
```javascript
const { Tool } = require('@langchain/core/tools');
const { tool } = require('@langchain/core/tools');
```

**Action Required:**
- Verify import paths remain valid
- Check for Tool class API changes

**Task Checklist:**
- [ ] Test all tool imports
- [ ] Verify Tool class initialization
- [ ] Test tool function creation with `tool()`
- [ ] Verify tool schema validation

**Verification:**
```bash
node -e "
const { Tool, tool } = require('@langchain/core/tools');
console.log('Tool imports successful');
"
```

#### 6.2 Update MCP Adapters

**File:** `nodejs/src/services/mcpService.js`

**Current Code:**
```javascript
const { MultiServerMCPClient } = require('@langchain/mcp-adapters');
```

**Action Required:**
- Verify v1.1.1 compatibility
- Check for new typed interrupt support
- Test MCP client initialization

**Task Checklist:**
- [ ] Test MCP client initialization
- [ ] Verify tool discovery works
- [ ] Test tool execution through MCP
- [ ] Check for new configuration options

**Verification:**
- [ ] Manual test: Initialize MCP client
- [ ] Manual test: List available MCP tools
- [ ] Manual test: Execute MCP tool

#### 6.3 Update Callbacks

**File:** `nodejs/src/services/callbacks/costCalcHandler.js`

**Current Code:**
```javascript
const { BaseCallbackHandler } = require('@langchain/core/callbacks/base');
```

**Action Required:**
- Verify callback handler API compatibility
- Test cost calculation with v1 models

**Task Checklist:**
- [ ] Test callback handler initialization
- [ ] Verify callback methods are called
- [ ] Test cost calculation accuracy
- [ ] Check for new callback events in v1

**Verification:**
- [ ] Manual test: Run chat with cost tracking
- [ ] Verify cost calculations are accurate

---

## Phase 7: Code Migration - Embeddings and Text Splitters

**Duration:** 1-2 hours  
**Risk:** LOW  
**Prerequisites:** Phase 6 complete  
**Files:**
- `nodejs/src/services/embeddings.js`
- `nodejs/src/services/upload.js`
- `nodejs/src/services/uploadFile.js`
- `nodejs/src/services/customgpt.js`

### Critical Changes Needed

#### 7.1 Update OpenAI Embeddings

**File:** `nodejs/src/services/embeddings.js`

**Current Code:**
```javascript
const { OpenAIEmbeddings } = require('@langchain/openai');
```

**Action Required:**
- Verify OpenAIEmbeddings API in v1
- Test embedding generation

**Task Checklist:**
- [ ] Test OpenAIEmbeddings initialization
- [ ] Test embedding generation for single text
- [ ] Test batch embedding generation
- [ ] Verify embedding dimensions

**Verification:**
```bash
node -e "
const { OpenAIEmbeddings } = require('@langchain/openai');
const embeddings = new OpenAIEmbeddings();
console.log('OpenAIEmbeddings initialized successfully');
"
```

#### 7.2 Update Text Splitters

**Files:** `upload.js`, `uploadFile.js`, `customgpt.js`

**Current Code:**
```javascript
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
```

**Action Required:**
- Verify text splitter API (minimal changes expected)
- Test text splitting functionality

**Task Checklist:**
- [ ] Test RecursiveCharacterTextSplitter initialization
- [ ] Test text splitting with various chunk sizes
- [ ] Test overlap configuration
- [ ] Verify split documents format

**Verification:**
- [ ] Manual test: Upload document
- [ ] Verify document is split correctly
- [ ] Check chunk sizes and overlaps

---

## Phase 8: Testing and Validation

**Duration:** 3-5 days  
**Risk:** MEDIUM  
**Prerequisites:** All code migrations complete

### Comprehensive Testing Plan

#### 8.1 Unit Tests

**Task Checklist:**
- [ ] Run existing test suite
- [ ] Fix any failing tests
- [ ] Add new tests for v1-specific features
- [ ] Achieve > 80% code coverage on changed files

**Commands:**
```bash
cd nodejs
npm test

# If tests fail, investigate and fix:
npm test -- --verbose
```

**Verification:**
- [ ] All unit tests pass
- [ ] No regression in existing functionality
- [ ] Code coverage maintained or improved

#### 8.2 Integration Tests

**Manual Test Scenarios:**

##### 8.2.1 Chat Functionality
- [ ] Start new chat with OpenAI (GPT-4)
- [ ] Start new chat with Anthropic (Claude)
- [ ] Start new chat with Google (Gemini)
- [ ] Test multi-turn conversations (5+ messages)
- [ ] Test conversation history retrieval
- [ ] Test conversation memory/context

##### 8.2.2 Tool Usage
- [ ] Test chat with web search tool
- [ ] Test chat with image generation tool
- [ ] Test chat with MCP tools (if configured)
- [ ] Test tool error handling
- [ ] Test multiple tool calls in single response

##### 8.2.3 Streaming
- [ ] Test streaming chat with OpenAI
- [ ] Test streaming chat with Anthropic
- [ ] Test streaming chat with Gemini
- [ ] Verify frontend displays chunks correctly
- [ ] Test stream interruption/cancellation

##### 8.2.4 Document Upload
- [ ] Upload PDF document
- [ ] Upload text document
- [ ] Upload large document (>1MB)
- [ ] Verify document chunking
- [ ] Test document search/retrieval
- [ ] Test embeddings generation

##### 8.2.5 Memory Management
- [ ] Test conversation summarization
- [ ] Test memory pruning with long conversations
- [ ] Test system message handling
- [ ] Verify checkpoint generation

##### 8.2.6 Chat Import/Export
- [ ] Import conversation from file
- [ ] Export conversation to file
- [ ] Verify data integrity
- [ ] Test with large conversations

##### 8.2.7 Error Scenarios
- [ ] Test with invalid API key
- [ ] Test with rate limit exceeded
- [ ] Test with network timeout
- [ ] Test with malformed input
- [ ] Verify error messages are user-friendly

**Verification:**
- [ ] All integration tests pass
- [ ] No critical bugs found
- [ ] Error handling works correctly
- [ ] Performance is acceptable

#### 8.3 Performance Testing

**Metrics to Measure:**

```bash
# Response time tests
ab -n 100 -c 10 http://localhost:3000/napi/v1/web/chat/send

# Memory usage monitoring
docker stats node_app

# Database query performance
# Monitor MongoDB slow query log
```

**Task Checklist:**
- [ ] Measure baseline performance (current version)
- [ ] Measure upgraded performance (v1)
- [ ] Compare response times
- [ ] Compare memory usage
- [ ] Compare CPU usage
- [ ] Identify and fix performance regressions

**Verification:**
- [ ] Performance degradation < 10%
- [ ] No memory leaks detected
- [ ] Response times within acceptable range

#### 8.4 Compatibility Testing

**Task Checklist:**
- [ ] Test on Node.js 20.x
- [ ] Test on Node.js 22.x (latest LTS)
- [ ] Test in Docker container
- [ ] Test in production-like environment
- [ ] Test with real API keys (all providers)

**Verification:**
- [ ] Works on all supported Node.js versions
- [ ] Docker build succeeds
- [ ] All providers work correctly

#### 8.5 Documentation Updates

**Task Checklist:**
- [ ] Update README.md with v1 information
- [ ] Update API documentation
- [ ] Document breaking changes
- [ ] Update deployment instructions
- [ ] Create rollback procedure document

**Verification:**
- [ ] Documentation is accurate
- [ ] All code examples work
- [ ] Breaking changes clearly documented

---

## Phase 9: Staged Deployment

**Duration:** 1 week  
**Risk:** MEDIUM  
**Prerequisites:** All testing complete and passed

### Deployment Strategy

#### 9.1 Deploy to Staging Environment

**Task Checklist:**
- [ ] Merge feature branch to staging branch
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Monitor logs for errors
- [ ] Test with real users (beta testers)

**Commands:**
```bash
git checkout staging
git merge feature/langchain-v1-upgrade
git push origin staging

# Deploy (adjust for your deployment method)
docker-compose -f docker-compose.staging.yml up --build -d
```

**Verification:**
- [ ] Staging deployment successful
- [ ] No errors in logs
- [ ] Smoke tests pass
- [ ] Beta testers provide positive feedback

**Soak Period:** 2-3 days minimum

#### 9.2 Monitor Staging

**Metrics to Monitor:**

```bash
# Error rate
docker logs node_app | grep -i error | wc -l

# Response times
# Check application metrics/monitoring dashboard

# API usage per provider
# Check database queries for provider usage stats
```

**Task Checklist:**
- [ ] Monitor error logs daily
- [ ] Track response times
- [ ] Monitor API usage/costs
- [ ] Collect user feedback
- [ ] Fix any issues found

**Verification:**
- [ ] Error rate < 1%
- [ ] No critical bugs reported
- [ ] Performance acceptable
- [ ] User feedback positive

#### 9.3 Deploy to Production

**Pre-Deployment Checklist:**
- [ ] All staging tests passed
- [ ] No critical bugs in staging
- [ ] Team approval received
- [ ] Rollback plan documented and tested
- [ ] Monitoring and alerting configured
- [ ] Maintenance window scheduled (if needed)
- [ ] Stakeholders notified

**Deployment Steps:**

```bash
# 1. Create production release branch
git checkout main
git merge feature/langchain-v1-upgrade
git tag -a v1.0.0-langchain-v1 -m "Upgrade to LangChain v1"
git push origin main --tags

# 2. Backup production database
# [Use your backup procedure]

# 3. Deploy to production
docker-compose down
docker-compose up --build -d

# 4. Run smoke tests
curl -X POST http://localhost:3000/napi/v1/web/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# 5. Monitor logs
docker logs -f node_app
```

**Post-Deployment Monitoring (First 24 hours):**
- [ ] Monitor error logs every 2 hours
- [ ] Check response times hourly
- [ ] Monitor API costs
- [ ] Track user complaints/issues
- [ ] Have rollback ready if needed

**Verification:**
- [ ] Production deployment successful
- [ ] No critical errors in first 24 hours
- [ ] Performance metrics normal
- [ ] User satisfaction maintained

---

## Rollback Plan

In case of critical issues, follow this rollback procedure:

### Immediate Rollback (< 30 minutes)

```bash
# 1. Stop current containers
docker-compose down

# 2. Restore backup package files
cd nodejs
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json
cp pnpm-lock.yaml.backup pnpm-lock.yaml

# 3. Reinstall old dependencies
rm -rf node_modules
npm install --legacy-peer-deps
npm rebuild bcrypt --build-from-source

# 4. Restart services
cd ..
docker-compose up --build -d

# 5. Verify service is working
curl http://localhost:3000/health
```

### Git Rollback (If code changes deployed)

```bash
# 1. Revert to previous commit
git log --oneline  # Find commit hash before upgrade
git revert <commit-hash>
git push origin main

# 2. Redeploy
docker-compose down
docker-compose up --build -d
```

### Database Rollback (If needed)

```bash
# Restore from backup
# [Use your restore procedure]
```

**Rollback Verification:**
- [ ] Service is running
- [ ] Health check passes
- [ ] Chat functionality works
- [ ] No errors in logs

---

## Success Criteria

The upgrade is considered successful when:

- [ ] All 14 affected files updated successfully
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No performance regression (< 10% degradation)
- [ ] All LLM providers work correctly (OpenAI, Anthropic, Gemini)
- [ ] Streaming functionality works
- [ ] Tool calling works
- [ ] Document upload and processing works
- [ ] Memory management works
- [ ] No critical bugs in production for 1 week
- [ ] Error rate < 1%
- [ ] User satisfaction maintained or improved

---

## Risk Mitigation

### High-Risk Areas

1. **LangGraph State Management**
   - **Risk:** StateGraph API changes may break existing workflows
   - **Mitigation:** Comprehensive testing of graph compilation and execution
   - **Fallback:** Keep v0 implementation in separate branch for reference

2. **Memory Service**
   - **Risk:** ConversationSummaryBufferMemory behavior may change
   - **Mitigation:** Test with long conversations, verify pruning works
   - **Fallback:** Implement custom memory management if needed

3. **Message Format Changes**
   - **Risk:** Message serialization may break existing data
   - **Mitigation:** Test with existing database records, verify backwards compatibility
   - **Fallback:** Data migration script if format incompatible

4. **Performance Regression**
   - **Risk:** V1 may be slower than v0
   - **Mitigation:** Benchmark before and after, optimize slow paths
   - **Fallback:** Performance tuning, caching, or rollback if severe

### Medium-Risk Areas

1. **Tool Integration**
   - **Risk:** Tool binding APIs may have changed
   - **Mitigation:** Test all tools individually and in combination
   - **Fallback:** Update tool implementations to match v1 API

2. **Streaming Implementation**
   - **Risk:** Event stream encoding changes may break frontend
   - **Mitigation:** Test streaming with all providers, verify SSE format
   - **Fallback:** Adjust frontend if necessary, or use compatibility layer

### Low-Risk Areas

1. **Text Splitters**
   - **Risk:** Minimal changes expected
   - **Mitigation:** Basic testing sufficient
   - **Fallback:** Unlikely to need fallback

2. **Embeddings**
   - **Risk:** API unlikely to change significantly
   - **Mitigation:** Test embedding generation
   - **Fallback:** Unlikely to need fallback

---

## Post-Upgrade Enhancements

After successful upgrade and stabilization (2-4 weeks), consider implementing these v1-specific features:

### Short-Term (1-2 weeks)

1. **Middleware System**
   - Implement custom middleware for cost tracking
   - Add request/response logging middleware
   - Create error handling middleware

2. **Model Profiles**
   - Leverage model profiles for better provider selection
   - Use capability detection for feature availability
   - Implement automatic fallback based on model capabilities

3. **Standard Content Blocks**
   - Enable `LC_OUTPUT_VERSION=v1` for content block serialization
   - Update frontend to handle content blocks
   - Support multimodal content (images, audio, etc.)

### Medium-Term (1 month)

1. **Structured Output Improvements**
   - Migrate to `providerStrategy` for native structured output
   - Leverage Gemini's native JSON mode
   - Improve response validation

2. **Advanced Tool Integration**
   - Implement provider built-in tools (file search, web search, etc.)
   - Add tool retry middleware
   - Implement tool error recovery strategies

3. **Enhanced Monitoring**
   - Implement content moderation middleware
   - Add model retry middleware for reliability
   - Track model usage patterns and costs

### Long-Term (2-3 months)

1. **Migration to `createAgent`**
   - Evaluate LangChain's new `createAgent` API
   - Migrate from custom LangGraph implementation if beneficial
   - Leverage middleware ecosystem

2. **Performance Optimization**
   - Implement caching strategies
   - Optimize message serialization
   - Tune memory management parameters

3. **Advanced Features**
   - Implement human-in-the-loop approvals
   - Add dynamic system prompts
   - Create custom agent workflows

---

## Appendix A: Package Dependency Matrix

```
@langchain/core@1.1.8
├─ Required by ALL LangChain packages
├─ Breaking changes: Message format, tool APIs, callback handlers
└─ Migration priority: CRITICAL

@langchain/openai@1.2.0
├─ Depends on: @langchain/core ^1.0.0
├─ Breaking changes: Tool strategies, structured output
└─ Migration priority: HIGH

@langchain/anthropic@1.3.3
├─ Depends on: @langchain/core 1.1.8
├─ Breaking changes: Built-in tools, message handling
└─ Migration priority: HIGH

@langchain/google-genai@2.1.3
├─ Depends on: @langchain/core 1.1.8
├─ Breaking changes: Message format (previously caused bugs)
└─ Migration priority: HIGH

@langchain/langgraph@1.0.7
├─ Depends on: @langchain/core ^1.0.1
├─ Breaking changes: StateGraph API, streaming, interrupts
└─ Migration priority: CRITICAL

@langchain/mcp-adapters@1.1.1
├─ Depends on: @langchain/core ^1.0.0, @langchain/langgraph ^1.0.0
├─ Breaking changes: Typed interrupts
└─ Migration priority: MEDIUM

@langchain/textsplitters@1.0.1
├─ Depends on: @langchain/core ^1.0.0
├─ Breaking changes: Minimal
└─ Migration priority: LOW

langchain@1.2.3
├─ Depends on: @langchain/core 1.1.8
├─ Breaking changes: Package restructure, legacy code moved
└─ Migration priority: HIGH
```

---

## Appendix B: File Impact Matrix

| File | Lines | Packages Used | Changes Required | Estimated Time |
|------|-------|---------------|------------------|----------------|
| `services/langgraph.js` | ~1800 | 6 packages | HIGH - StateGraph, streaming, tools | 4-6 hours |
| `services/memoryService.js` | ~684 | 3 packages | HIGH - Memory moved to classic | 2-3 hours |
| `services/thread.js` | ~500 | 2 packages | MEDIUM - Model initialization | 1-2 hours |
| `services/importChatProcessor.js` | ~400 | 3 packages | MEDIUM - Message handling | 1-2 hours |
| `services/importChatProcessorAnthropic.js` | ~400 | 3 packages | MEDIUM - Message handling | 1-2 hours |
| `services/embeddings.js` | ~200 | 1 package | LOW - API verification | 30 min |
| `services/upload.js` | ~300 | 1 package | LOW - Text splitter check | 30 min |
| `services/uploadFile.js` | ~300 | 1 package | LOW - Text splitter check | 30 min |
| `services/customgpt.js` | ~400 | 1 package | LOW - Text splitter check | 30 min |
| `services/searchTool.js` | ~150 | 1 package | LOW - Tool API verification | 30 min |
| `services/imageTool.js` | ~150 | 1 package | LOW - Tool API verification | 30 min |
| `services/geminiImageTool.js` | ~150 | 1 package | LOW - Tool API verification | 30 min |
| `services/promptWebScraper.js` | ~200 | 1 package | LOW - Message handling | 30 min |
| `services/mcpService.js` | ~300 | 1 package | MEDIUM - MCP adapter update | 1 hour |
| `services/callbacks/costCalcHandler.js` | ~100 | 1 package | LOW - Callback API verification | 30 min |

**Total Estimated Development Time:** 15-22 hours  
**Total Estimated Testing Time:** 24-40 hours  
**Total Project Duration:** 2-3 weeks (including testing and deployment)

---

## Appendix C: Testing Checklist

### Pre-Upgrade Testing
- [ ] Document all current API endpoints
- [ ] Capture current response times
- [ ] Document current error rate
- [ ] Export sample conversations for testing
- [ ] Backup production database

### Unit Testing
- [ ] `services/langgraph.js` - StateGraph compilation
- [ ] `services/langgraph.js` - Model invocation
- [ ] `services/langgraph.js` - Tool execution
- [ ] `services/langgraph.js` - Streaming
- [ ] `services/memoryService.js` - Memory initialization
- [ ] `services/memoryService.js` - Message storage
- [ ] `services/memoryService.js` - Message retrieval
- [ ] `services/memoryService.js` - Memory pruning
- [ ] All tool files - Tool execution
- [ ] All processor files - Message processing

### Integration Testing
- [ ] OpenAI chat (single message)
- [ ] OpenAI chat (multi-turn)
- [ ] OpenAI chat with tools
- [ ] OpenAI streaming
- [ ] Anthropic chat (single message)
- [ ] Anthropic chat (multi-turn)
- [ ] Anthropic chat with tools
- [ ] Anthropic streaming
- [ ] Gemini chat (single message)
- [ ] Gemini chat (multi-turn)
- [ ] Gemini chat with tools
- [ ] Gemini streaming
- [ ] Document upload (PDF)
- [ ] Document upload (TXT)
- [ ] Document upload (large files)
- [ ] Document search
- [ ] Conversation import
- [ ] Conversation export
- [ ] Memory management with long conversations
- [ ] Error handling (invalid API key)
- [ ] Error handling (rate limit)
- [ ] Error handling (network timeout)

### Performance Testing
- [ ] Response time baseline
- [ ] Response time after upgrade
- [ ] Memory usage baseline
- [ ] Memory usage after upgrade
- [ ] CPU usage baseline
- [ ] CPU usage after upgrade
- [ ] Concurrent request handling
- [ ] Database query performance
- [ ] API cost comparison

### User Acceptance Testing
- [ ] Beta tester feedback collected
- [ ] No critical issues reported
- [ ] User satisfaction survey
- [ ] Feature parity verified

---

## Appendix D: Useful Commands

### Development Commands
```bash
# Check current versions
npm list @langchain/core @langchain/openai @langchain/anthropic

# Test imports
node -e "const { ChatOpenAI } = require('@langchain/openai'); console.log('OK');"

# Run single test file
npm test -- services/langgraph.test.js

# Watch mode for development
npm run dev

# Check for outdated packages
npm outdated

# Audit security vulnerabilities
npm audit
```

### Docker Commands
```bash
# Rebuild containers
docker-compose down
docker-compose up --build -d

# View logs
docker logs -f node_app

# Check container resource usage
docker stats

# Enter container for debugging
docker exec -it node_app /bin/bash

# Clean up unused images
docker system prune -a
```

### Debugging Commands
```bash
# Enable debug logging
export DEBUG=langchain:*
npm run dev

# Test specific model
node -e "
const { ChatOpenAI } = require('@langchain/openai');
const model = new ChatOpenAI({ model: 'gpt-4' });
model.invoke('Hello').then(console.log);
"

# Check Node.js version in Docker
docker exec node_app node --version

# Monitor database queries
# [Use your MongoDB monitoring tool]
```

---

## Appendix E: Contact and Resources

### Internal Contacts
- **Project Lead:** [Name]
- **Backend Team Lead:** [Name]
- **DevOps Lead:** [Name]
- **QA Lead:** [Name]

### External Resources
- **LangChain Docs:** https://js.langchain.com/docs/
- **LangGraph Docs:** https://langchain-ai.github.io/langgraphjs/
- **Migration Guide:** https://docs.langchain.com/oss/javascript/migrate/langchain-v1
- **GitHub Issues:** https://github.com/langchain-ai/langchainjs/issues
- **Discord:** https://discord.gg/langchain

### Support Channels
- LangChain Discord: `#javascript` channel
- GitHub Discussions: https://github.com/langchain-ai/langchainjs/discussions
- Stack Overflow: Tag `langchain` and `javascript`

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-28 | AI Assistant | Initial comprehensive upgrade plan |

---

**End of Document**

This plan should be treated as a living document and updated as the upgrade progresses. Any deviations from the plan or unexpected issues should be documented for future reference.
