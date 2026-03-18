import { test, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PermissionComposer } from "../../src/views/chat/components/permission/permission-composer";
import { getActivePermission } from "../../src/views/chat/render-state";

async function noopAsync() {}

test("PermissionComposer renders an active streaming permission", () => {
  const activePermission = getActivePermission([
    {
      type: "tool_use" as const,
      partId: "tool_RfA5gb2yXtJbtfImHq7V5ELk",
      tool: "permission",
      status: "running" as const,
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

  expect(activePermission).toBeTruthy();

  const html = renderToStaticMarkup(
    createElement(PermissionComposer, {
      permission: activePermission!,
      onReply: noopAsync,
    }),
  );

  expect(html).toMatch(/aria-label="Permission request"/);
  expect(html).toMatch(/Permission required:/);
  expect(html).toMatch(/edit/);
  expect(html).toMatch(/default\/测试笔记\.md/);
  expect(html).toMatch(/Index: default\/测试笔记\.md/);
  expect(html).toMatch(/View diff/);
  expect(html).toMatch(/Allow once/);
  expect(html).toMatch(/Allow always/);
  expect(html).toMatch(/Deny/);
});
