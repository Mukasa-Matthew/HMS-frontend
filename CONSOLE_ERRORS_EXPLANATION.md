# Console Errors Explanation

## Browser Extension Errors (NOT from your app - Safe to Ignore)

All these errors are from browser extensions and cannot be fixed in your code:

- `Error: Attempting to use a disconnected port object` - Browser extension issue
- `Error: Called encrypt() without a session key` - Password manager extension issue
- `Failed to load resource: net::ERR_FILE_NOT_FOUND` for `utils.js`, `extensionState.js`, `heuristicsRedefinitions.js` - Browser extension files

**Solution**: These are harmless and can be ignored. They don't affect your application.

## Application Warnings (Non-Critical)

### 1. Framer Motion Deprecation
- **Warning**: `motion() is deprecated. Use motion.create() instead.`
- **Status**: Non-breaking, just a future API change notice
- **Impact**: None - your animations still work perfectly

### 2. React Router Future Flags
- **Warning**: Future flag warnings about v7 changes
- **Status**: Non-breaking, informational only
- **Impact**: None - your routing works perfectly

## How to Filter Console Errors

In Chrome DevTools:
1. Open Console Settings (gear icon)
2. Enable "Hide network messages"
3. Use console filters to hide extension errors

Or use console filters:
- Type `-extension` in the console filter to hide extension errors
- Type `-chrome-extension` to hide all extension-related messages
