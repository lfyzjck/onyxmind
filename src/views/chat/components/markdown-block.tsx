import { Component, MarkdownRenderer } from "obsidian";
import { useEffect, useRef } from "react";
import type OnyxMindPlugin from "../../../main";
import { stripCurrentNoteBlocks } from "../current-note-sanitizer";
import { processFileLinks } from "../file-link";

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

    let cancelled = false;
    const renderedContent = stripCurrentNoteBlocks(content);
    const renderComponent = new Component();
    renderComponent.load();
    clearElement(container);

    const render = async (): Promise<void> => {
      try {
        await MarkdownRenderer.render(
          plugin.app,
          renderedContent,
          container,
          "",
          renderComponent,
        );
        if (!cancelled) {
          processFileLinks(plugin.app, container);
        }
      } catch (error) {
        console.error("[OnyxMind] Failed to render markdown block", error);
      }
    };

    void render();

    return () => {
      cancelled = true;
      renderComponent.unload();
    };
  }, [content, plugin]);

  return <div className={className} ref={containerRef} />;
}
