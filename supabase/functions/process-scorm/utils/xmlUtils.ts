export function getNodeText(node: Element | null, selector: string): string | undefined {
  return node?.querySelector(selector)?.textContent?.trim();
}

export function getNodeAttribute(node: Element | null, attribute: string): string | undefined {
  return node?.getAttribute(attribute)?.trim();
}

export function getAllNodes(node: Element | null, selector: string): Element[] {
  return node ? Array.from(node.querySelectorAll(selector)) : [];
}

export function hasNamespace(manifest: Element, namespace: string): boolean {
  return Array.from(manifest.attributes).some(attr => 
    attr.value.includes(namespace)
  );
}