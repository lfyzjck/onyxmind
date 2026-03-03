import { MarkdownRenderer } from "obsidian";
import { useEffect, useRef } from "react";
import type OnyxMindPlugin from "../../../main";

function clearElement(el: HTMLElement): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

interface MarkdownBlockProps {
  plugin: OnyxMindPlugin;
  content: string;
  className: string;
}

export function MarkdownBlock(props: MarkdownBlockProps) {
  const { plugin, content, className } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    clearElement(container);
    void MarkdownRenderer.renderMarkdown(content, container, "", plugin as any);
  }, [content, plugin]);

  return <div className={className} ref={containerRef} />;
}
