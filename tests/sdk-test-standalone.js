/**
 * OpenCode SDK 独立测试脚本
 * 可以直接用 Node.js 运行，不依赖 Obsidian
 */

import { createOpencodeClient } from "@opencode-ai/sdk/client";

const BASE_URL = "http://127.0.0.1:4096";
const TEST_DIRECTORY = "/Users/jiachengkun/projects/onyxmind";

class SDKTester {
  constructor() {
    this.client = null;
    this.testSessionId = null;
  }

  /**
   * 初始化客户端
   */
  async initialize() {
    console.log("\n=== 1. 初始化 OpenCode 客户端 ===");
    console.log("Base URL:", BASE_URL);

    try {
      this.client = createOpencodeClient({
        baseUrl: BASE_URL,
      });
      console.log("✅ 客户端初始化成功");
    } catch (error) {
      console.error("❌ 客户端初始化失败:", error);
      throw error;
    }
  }

  /**
   * 测试 session.create 接口
   */
  async testSessionCreate() {
    console.log("\n=== 2. 测试 session.create ===");

    if (!this.client) {
      throw new Error("客户端未初始化");
    }

    const testCases = [
      {
        name: "使用绝对路径",
        params: {
          body: { title: "Test Session 1" },
          query: { directory: TEST_DIRECTORY },
        },
      },
      {
        name: "使用相对路径",
        params: {
          body: { title: "Test Session 2" },
          query: { directory: "." },
        },
      },
      {
        name: "不提供 directory",
        params: {
          body: { title: "Test Session 3" },
        },
      },
      {
        name: "空 title",
        params: {
          body: {},
          query: { directory: TEST_DIRECTORY },
        },
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n--- 测试: ${testCase.name} ---`);
      console.log("请求参数:", JSON.stringify(testCase.params, null, 2));

      try {
        const response = await this.client.session.create(testCase.params);
        console.log("响应类型:", typeof response);
        console.log("响应结构:", Object.keys(response));
        console.log("完整响应:", JSON.stringify(response, null, 2));

        // 检查响应数据
        if ("data" in response) {
          console.log("data 类型:", typeof response.data);
          console.log("data 是否为数组:", Array.isArray(response.data));

          if (response.data && typeof response.data === "object") {
            console.log("data 的 keys:", Object.keys(response.data));

            if ("id" in response.data) {
              console.log("✅ Session ID:", response.data.id);
              this.testSessionId = response.data.id;
            } else {
              console.log("⚠️ data 中没有 id 字段");
            }
          }
        }
      } catch (error) {
        console.error("❌ 请求失败:", error);
        if (error instanceof Error) {
          console.error("错误消息:", error.message);
          console.error("错误堆栈:", error.stack);
        }
      }
    }
  }

  /**
   * 测试 session.list 接口
   */
  async testSessionList() {
    console.log("\n=== 3. 测试 session.list ===");

    if (!this.client) {
      throw new Error("客户端未初始化");
    }

    try {
      const response = await this.client.session.list();
      console.log("响应类型:", typeof response);
      console.log("响应结构:", Object.keys(response));
      console.log("完整响应:", JSON.stringify(response, null, 2));

      if ("data" in response && Array.isArray(response.data)) {
        console.log("✅ Session 列表数量:", response.data.length);
        response.data.forEach((session, index) => {
          console.log(`Session ${index}:`, {
            id: session.id,
            title: session.title,
            created: session.time?.created,
          });
        });
      }
    } catch (error) {
      console.error("❌ 列表获取失败:", error);
      if (error instanceof Error) {
        console.error("错误消息:", error.message);
      }
    }
  }

  /**
   * 测试 session.get 接口
   */
  async testSessionGet() {
    console.log("\n=== 4. 测试 session.get ===");

    if (!this.client) {
      throw new Error("客户端未初始化");
    }

    if (!this.testSessionId) {
      console.log("⚠️ 没有可用的 session ID，跳过测试");
      return;
    }

    console.log("获取 Session ID:", this.testSessionId);

    try {
      const response = await this.client.session.get({
        path: { id: this.testSessionId },
      });

      console.log("响应类型:", typeof response);
      console.log("响应结构:", Object.keys(response));
      console.log("完整响应:", JSON.stringify(response, null, 2));

      if ("data" in response && response.data) {
        console.log("✅ Session 详情:", {
          id: response.data.id,
          title: response.data.title,
          directory: response.data.directory,
        });
      }
    } catch (error) {
      console.error("❌ 获取失败:", error);
      if (error instanceof Error) {
        console.error("错误消息:", error.message);
      }
    }
  }

  /**
   * 测试 session.prompt 接口
   */
  async testSessionPrompt() {
    console.log("\n=== 5. 测试 session.prompt ===");

    if (!this.client) {
      throw new Error("客户端未初始化");
    }

    if (!this.testSessionId) {
      console.log("⚠️ 没有可用的 session ID，跳过测试");
      return;
    }

    console.log("使用 Session ID:", this.testSessionId);

    const testPrompts = ["Hello, can you hear me?", "What is 2+2?"];

    for (const prompt of testPrompts) {
      console.log(`\n--- 测试 prompt: "${prompt}" ---`);

      try {
        const response = await this.client.session.prompt({
          path: { id: this.testSessionId },
          body: {
            parts: [{ type: "text", text: prompt }],
          },
        });

        console.log("响应类型:", typeof response);
        console.log("响应结构:", Object.keys(response));
        console.log("完整响应:", JSON.stringify(response, null, 2));

        if ("data" in response && response.data) {
          console.log("data 类型:", typeof response.data);

          if (typeof response.data === "object" && "parts" in response.data) {
            const parts = response.data.parts;
            console.log("parts 数量:", parts?.length);

            if (Array.isArray(parts)) {
              parts.forEach((part, index) => {
                console.log(`Part ${index}:`, part);
              });
            }
          }
        }

        console.log("✅ Prompt 发送成功");
        break; // 只测试第一个成功的
      } catch (error) {
        console.error("❌ Prompt 失败:", error);
        if (error instanceof Error) {
          console.error("错误消息:", error.message);
        }
      }
    }
  }

  /**
   * 测试 session.delete 接口
   */
  async testSessionDelete() {
    console.log("\n=== 6. 测试 session.delete ===");

    if (!this.client) {
      throw new Error("客户端未初始化");
    }

    if (!this.testSessionId) {
      console.log("⚠️ 没有可用的 session ID，跳过测试");
      return;
    }

    console.log("删除 Session ID:", this.testSessionId);

    try {
      const response = await this.client.session.delete({
        path: { id: this.testSessionId },
      });

      console.log("响应类型:", typeof response);
      console.log("响应结构:", Object.keys(response));
      console.log("完整响应:", JSON.stringify(response, null, 2));
      console.log("✅ Session 删除成功");

      this.testSessionId = null;
    } catch (error) {
      console.error("❌ 删除失败:", error);
      if (error instanceof Error) {
        console.error("错误消息:", error.message);
      }
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log("╔════════════════════════════════════════╗");
    console.log("║   OpenCode SDK 接口测试开始            ║");
    console.log("╚════════════════════════════════════════╝");

    try {
      await this.initialize();
      await this.testSessionCreate();
      await this.testSessionList();
      await this.testSessionGet();
      await this.testSessionPrompt();
      await this.testSessionDelete();

      console.log("\n╔════════════════════════════════════════╗");
      console.log("║   所有测试完成                         ║");
      console.log("╚════════════════════════════════════════╝");
    } catch (error) {
      console.error("\n❌ 测试过程中出现错误:", error);
    }
  }
}

// 运行测试
const tester = new SDKTester();
tester.runAllTests().catch(console.error);
