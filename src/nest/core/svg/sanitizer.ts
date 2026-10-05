/**
 * SVG Security Sanitizer
 * Protects 0machine Nest against SVG-based XSS, scripts, external links, and malicious payloads.
 */

const DANGEROUS_TAGS = new Set([
  'script',
  'style',
  'foreignobject',
  'iframe',
  'embed',
  'object',
  'audio',
  'video',
  'form',
  'input',
  'button',
  'meta',
  'link',
]);

/**
 * Sanitizes raw SVG text string before XML DOM parsing.
 */
export function sanitizeSvgText(rawSvg: string): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';

  return rawSvg
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!ENTITY[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:href|xlink:href)\s*=\s*["']?\s*javascript:[^"'>]*["']?/gi, '');
}

/**
 * DOM element sanitizer for parsed XML elements.
 */
export function sanitizeSvgElement(element: Element): boolean {
  if (!element || !element.tagName) return false;
  const tagName = element.tagName.toLowerCase();

  // Strip dangerous elements
  if (DANGEROUS_TAGS.has(tagName)) {
    element.parentNode?.removeChild(element);
    return false;
  }

  // Remove inline event attributes (onload, onclick, etc.)
  if (element.attributes) {
    const attrs = Array.from(element.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      const val = attr.value.toLowerCase().trim();
      if (name.startsWith('on') || val.startsWith('javascript:')) {
        element.removeAttribute(attr.name);
      }
    }
  }

  // Recursively sanitize child elements
  const childNodes = element.childNodes ? Array.from(element.childNodes) : [];
  for (let i = childNodes.length - 1; i >= 0; i--) {
    const child = childNodes[i] as Element;
    if (child && child.nodeType === 1) {
      sanitizeSvgElement(child);
    }
  }

  return true;
}
