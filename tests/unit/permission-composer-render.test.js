import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTsModule } from "../helpers/load-ts.js";

const { PermissionComposer } = loadTsModule(
  "src/views/chat/components/permission-composer.tsx",
);
const { getActivePermission } = loadTsModule("src/views/chat/render-state.ts");

async function noopAsync() {}

test("PermissionComposer renders an active streaming permission", () => {
  const activePermission = getActivePermission([
    {
      type: "tool_use",
      partId: "tool_RfA5gb2yXtJbtfImHq7V5ELk",
      tool: "permission",
      status: "running",
      permissionId: "per_cfb1997b9001lAa9fxmJ1XtBgl",
      permissionType: "edit",
      permissionPatterns: ["default/测试笔记.md"],
      permissionMetadata: {
        filepath: "default/测试笔记.md",
        diff: [
          "Index: default/测试笔记.md",
          "===================================================================",
          "--- default/测试笔记.md",
          "+++ default/测试笔记.md",
          "@@ -0,0 +1,3 @@",
          "+---",
          "+title: 测试笔记",
          "+date: 2026-03-17",
        ].join("\n"),
      },
    },
  ]);

  assert.ok(activePermission);

  const html = renderToStaticMarkup(
    createElement(PermissionComposer, {
      permission: activePermission,
      onReply: noopAsync,
    }),
  );

  assert.match(html, /aria-label="Permission request"/);
  assert.match(html, /Permission required:/);
  assert.match(html, /edit/);
  assert.match(html, /default\/测试笔记\.md/);
  assert.match(html, /Index: default\/测试笔记\.md/);
  assert.match(html, /View diff/);
  assert.match(html, /Allow once/);
  assert.match(html, /Allow always/);
  assert.match(html, /Deny/);
});
