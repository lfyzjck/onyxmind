import type { App } from "obsidian";

const WIKILINK_PATTERN_SOURCE =
  "\\[\\[([^\\]|#^]+)(?:#[^\\]|]+)?(?:\\^[^\\]|]+)?(?:\\|[^\\]]+)?\\]\\]";

interface WikilinkMatch {
  index: number;
  fullMatch: string;
  linkTarget: string;
  displayText: string;
}

function createWikilinkPattern(): RegExp {
  return new RegExp(WIKILINK_PATTERN_SOURCE, "g");
}

function extractLinkTarget(fullMatch: string): string {
  const inner = fullMatch.slice(2, -2);
  const pipeIndex = inner.indexOf("|");
  return pipeIndex >= 0 ? inner.slice(0, pipeIndex) : inner;
}

function fileExistsInVault(app: App, linkPath: string): boolean {
  const resolved = app.metadataCache.getFirstLinkpathDest(linkPath, "");
  if (resolved) {
    return true;
  }

  const directFile = app.vault.getFileByPath(linkPath);
  if (directFile) {
    return true;
  }

  if (!linkPath.endsWith(".md")) {
    const markdownFile = app.vault.getFileByPath(`${linkPath}.md`);
    if (markdownFile) {
      return true;
    }
  }

  return false;
}

function findWikilinks(app: App, text: string): WikilinkMatch[] {
  const pattern = createWikilinkPattern();
  const matches: WikilinkMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > 0 && text.charAt(match.index - 1) === "!") {
      continue;
    }

    const fullMatch = match[0];
    const linkPath = match[1];
    if (!linkPath || !fileExistsInVault(app, linkPath)) {
      continue;
    }

    const linkTarget = extractLinkTarget(fullMatch);
    const pipeIndex = fullMatch.lastIndexOf("|");
    const displayText =
      pipeIndex > 0 ? fullMatch.slice(pipeIndex + 1, -2) : linkPath;

    matches.push({
      index: match.index,
      fullMatch,
      linkTarget,
      displayText,
    });
  }

  return matches.sort((a, b) => b.index - a.index);
}

function createWikilinkAnchor(
  linkTarget: string,
  displayText: string,
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = "onyxmind-file-link internal-link";
  link.textContent = displayText;
  link.setAttribute("data-href", linkTarget);
  link.setAttribute("href", linkTarget);
  return link;
}

function buildFragmentWithLinks(
  text: string,
  matches: WikilinkMatch[],
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  let currentIndex = text.length;

  for (const { index, fullMatch, linkTarget, displayText } of matches) {
    const endIndex = index + fullMatch.length;

    if (endIndex < currentIndex) {
      fragment.insertBefore(
        document.createTextNode(text.slice(endIndex, currentIndex)),
        fragment.firstChild,
      );
    }

    fragment.insertBefore(
      createWikilinkAnchor(linkTarget, displayText),
      fragment.firstChild,
    );
    currentIndex = index;
  }

  if (currentIndex > 0) {
    fragment.insertBefore(
      document.createTextNode(text.slice(0, currentIndex)),
      fragment.firstChild,
    );
  }

  return fragment;
}

function processTextNode(app: App, node: Text): void {
  const text = node.textContent;
  if (!text || !text.includes("[[")) {
    return;
  }

  const matches = findWikilinks(app, text);
  if (matches.length === 0) {
    return;
  }

  node.parentNode?.replaceChild(buildFragmentWithLinks(text, matches), node);
}

export function processFileLinks(app: App, container: HTMLElement): void {
  if (!container.textContent?.includes("[[")) {
    return;
  }

  container.querySelectorAll("code").forEach((codeEl) => {
    if (codeEl.parentElement?.tagName === "PRE") {
      return;
    }

    const text = codeEl.textContent;
    if (!text || !text.includes("[[")) {
      return;
    }

    const matches = findWikilinks(app, text);
    if (matches.length === 0) {
      return;
    }

    codeEl.textContent = "";
    codeEl.appendChild(buildFragmentWithLinks(text, matches));
  });

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) {
        return NodeFilter.FILTER_REJECT;
      }

      const tagName = parent.tagName.toUpperCase();
      if (tagName === "PRE" || tagName === "CODE" || tagName === "A") {
        return NodeFilter.FILTER_REJECT;
      }

      if (parent.closest("pre, code, a, .onyxmind-file-link, .internal-link")) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  for (const textNode of textNodes) {
    processTextNode(app, textNode);
  }
}

export function registerFileLinkClickHandler(
  app: App,
  container: HTMLElement,
): () => void {
  const handler = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest<HTMLAnchorElement>(
      ".onyxmind-file-link, .internal-link",
    );
    if (!link) {
      return;
    }

    const linkTarget = link.dataset.href ?? link.getAttribute("href") ?? "";
    if (!linkTarget || /^(https?:|mailto:|obsidian:|#)/i.test(linkTarget)) {
      return;
    }

    event.preventDefault();
    void app.workspace.openLinkText(linkTarget, "", "tab");
  };

  container.addEventListener("click", handler);
  return () => container.removeEventListener("click", handler);
}
