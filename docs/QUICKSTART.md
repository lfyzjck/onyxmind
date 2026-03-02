# OnyxMind MVP Demo - 快速开始

## 构建成功！✅

插件已成功构建。现在可以在 Obsidian 中测试 OpenCode SDK 集成。

## 快速开始

### 1. 在 Obsidian 中加载插件

**方法 A: 开发模式（推荐）**
```bash
# 在项目目录运行
npm run dev
```
然后在 Obsidian 中：
1. 打开设置 → 社区插件
2. 关闭安全模式
3. 点击"重新加载插件"
4. 启用 "OnyxMind"

**方法 B: 手动复制**
将以下文件复制到你的 vault 的 `.obsidian/plugins/onyxmind/` 目录：
- `main.js`
- `manifest.json`
- `styles.css`

### 2. 运行测试

有两种方式运行测试：

**方式 1: 使用 Ribbon 图标**
- 点击左侧 Ribbon 栏的烧瓶图标 (🧪)
- 所有测试将自动运行

**方式 2: 使用命令面板**
1. 打开命令面板 (Cmd/Ctrl + P)
2. 搜索 "Test OpenCode"
3. 选择以下命令之一：
   - `Test OpenCode: Check connection` - 测试服务连接
   - `Test OpenCode: Import SDK` - 测试 SDK 导入
   - `Test OpenCode: Create client` - 测试客户端创建
   - `Test OpenCode: Run all tests` - 运行所有测试

## 当前测试内容

这个 MVP demo 包含 3 个基础测试：

### 测试 1: 连接测试
- 检查 OpenCode 服务是否在 `localhost:8080` 上运行
- 发送 HTTP GET 请求到 `/health` 端点
- 验证服务可访问性

### 测试 2: SDK 导入测试
- 验证 `@opencode-ai/sdk/client` 可以正确导入
- 检查 `createOpencodeClient` 函数是否存在
- 输出 SDK 导出的所有方法到控制台

### 测试 3: 客户端创建测试
- 使用 `createOpencodeClient` 创建客户端实例
- 配置 baseUrl 为 `http://localhost:8080`
- 验证客户端对象创建成功
- 输出客户端方法到控制台

## 预期结果

如果一切正常，你应该看到：

```
🚀 Starting OpenCode SDK tests...
✅ OpenCode service is accessible
✅ OpenCode SDK imported successfully
✅ OpenCode client created successfully
✅ Basic tests completed! Check console for details.
💡 Next: Configure API key and test actual prompts
```

## 故障排查

### ❌ "OpenCode service not accessible"

**原因**: OpenCode 服务未运行

**解决方案**:
```bash
# 如果还没安装 OpenCode
npm install -g @opencode-ai/cli

# 启动服务
opencode serve --port 8080
```

### ❌ "SDK import failed"

**原因**: SDK 未正确安装

**解决方案**:
```bash
# 重新安装依赖
npm install

# 重新构建
npm run build
```

### ⚠️ 没有看到通知

**解决方案**:
1. 确认插件已启用（设置 → 社区插件）
2. 打开开发者控制台查看错误 (Cmd/Ctrl + Shift + I)
3. 尝试重新加载 Obsidian

## 查看详细日志

打开开发者控制台查看详细输出：
- **macOS**: Cmd + Option + I
- **Windows/Linux**: Ctrl + Shift + I

控制台会显示：
- SDK 导出的所有方法
- 客户端对象的所有方法
- 任何错误的详细堆栈跟踪

## 下一步

一旦所有测试通过，你可以：

1. **配置 API 密钥**
   - 设置 Anthropic API 密钥
   - 测试实际的 AI 提示

2. **实现完整功能**
   - 创建聊天界面
   - 添加会话管理
   - 集成编辑器命令

3. **参考文档**
   - `ARCHITECTURE.md` - 技术架构
   - `ROADMAP.md` - 开发路线图
   - `OBSIDIAN_BEST_PRACTICES.md` - 开发规范

## 项目文件

- `src/main.ts` - 插件主类
- `src/opencode-test-simple.ts` - 测试类
- `src/settings.ts` - 设置管理
- `manifest.json` - 插件清单
- `main.js` - 构建输出

## 技术栈

- **Obsidian Plugin API** - 插件框架
- **OpenCode SDK** - AI Agent 服务
- **TypeScript** - 开发语言
- **esbuild** - 构建工具

## 需要帮助？

- 查看 `MVP_README.md` 了解更多详情
- 查看 `CLAUDE.md` 了解开发指南
- 参考 `/Users/jiachengkun/opensource/infio-copilot` 的实现

---

**状态**: ✅ 构建成功，准备测试
**版本**: 0.1.0 MVP
**最后更新**: 2026-02-13
