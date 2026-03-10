# OnyxMind MVP Demo - Quick Start

## Build Successful! ✅

The plugin has been built successfully. You can now test the OpenCode SDK integration in Obsidian.

## Quick Start

### 1. Load the Plugin in Obsidian

**Method A: Development Mode (Recommended)**

```bash
# Run in the project directory
npm run dev
```

Then in Obsidian:

1. Open Settings → Community Plugins
2. Disable Safe Mode
3. Click "Reload Plugins"
4. Enable "OnyxMind"

**Method B: Manual Copy**
Copy the following files to the `.obsidian/plugins/onyxmind/` directory in your vault:

- `main.js`
- `manifest.json`
- `styles.css`

### 2. Run Tests

There are two ways to run tests:

**Method 1: Using the Ribbon Icon**

- Click the flask icon (🧪) in the left Ribbon bar
- All tests will run automatically

**Method 2: Using the Command Palette**

1. Open the Command Palette (Cmd/Ctrl + P)
2. Search for "Test OpenCode"
3. Select one of the following commands:
   - `Test OpenCode: Check connection` - Test service connection
   - `Test OpenCode: Import SDK` - Test SDK import
   - `Test OpenCode: Create client` - Test client creation
   - `Test OpenCode: Run all tests` - Run all tests

## What the Current Tests Cover

This MVP demo includes 3 basic tests:

### Test 1: Connection Test

- Checks if the OpenCode service is running at `localhost:8080`
- Sends an HTTP GET request to the `/health` endpoint
- Verifies service accessibility

### Test 2: SDK Import Test

- Verifies that `@opencode-ai/sdk/client` can be imported correctly
- Checks whether the `createOpencodeClient` function exists
- Outputs all methods exported by the SDK to the console

### Test 3: Client Creation Test

- Creates a client instance using `createOpencodeClient`
- Configures the baseUrl to `http://localhost:8080`
- Verifies that the client object is created successfully
- Outputs client methods to the console

## Expected Results

If everything is working correctly, you should see:

```
🚀 Starting OpenCode SDK tests...
✅ OpenCode service is accessible
✅ OpenCode SDK imported successfully
✅ OpenCode client created successfully
✅ Basic tests completed! Check console for details.
💡 Next: Configure API key and test actual prompts
```

## Troubleshooting

### ❌ "OpenCode service not accessible"

**Cause**: The OpenCode service is not running

**Solution**:

```bash
# If OpenCode is not yet installed
npm install -g @opencode-ai/cli

# Start the service
opencode serve --port 8080
```

### ❌ "SDK import failed"

**Cause**: The SDK is not installed correctly

**Solution**:

```bash
# Reinstall dependencies
npm install

# Rebuild
npm run build
```

### ⚠️ No notifications appearing

**Solution**:

1. Confirm the plugin is enabled (Settings → Community Plugins)
2. Open the Developer Console to check for errors (Cmd/Ctrl + Shift + I)
3. Try reloading Obsidian

## Viewing Detailed Logs

Open the Developer Console to see detailed output:

- **macOS**: Cmd + Option + I
- **Windows/Linux**: Ctrl + Shift + I

The console will display:

- All methods exported by the SDK
- All methods on the client object
- Detailed stack traces for any errors

## Next Steps

Once all tests pass, you can:

1. **Configure the API Key**
   - Set up the Anthropic API key
   - Test actual AI prompts

2. **Implement Full Features**
   - Create the chat interface
   - Add session management
   - Integrate editor commands

3. **Reference Documentation**
   - `ARCHITECTURE.md` - Technical architecture
   - `ROADMAP.md` - Development roadmap
   - `OBSIDIAN_BEST_PRACTICES.md` - Development guidelines

## Project Files

- `src/main.ts` - Plugin main class
- `src/opencode-test-simple.ts` - Test class
- `src/settings.ts` - Settings management
- `manifest.json` - Plugin manifest
- `main.js` - Build output

## Tech Stack

- **Obsidian Plugin API** - Plugin framework
- **OpenCode SDK** - AI Agent service
- **TypeScript** - Development language
- **esbuild** - Build tool

## Need Help?

- See `MVP_README.md` for more details
- See `CLAUDE.md` for development guidelines
- Reference the implementation at `/Users/jiachengkun/opensource/infio-copilot`

---

**Status**: ✅ Build successful, ready for testing
**Version**: 0.1.0 MVP
**Last Updated**: 2026-02-13
