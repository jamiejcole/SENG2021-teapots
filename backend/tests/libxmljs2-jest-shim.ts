/**
 * Pure-JS stand-in for libxmljs2 used only under Jest (see jest.config.cjs moduleNameMapper).
 * Keeps CI/dev machines working when the native xmljs.node binary does not match Node.
 */
import { DOMParser, type Element as XmldomElement } from '@xmldom/xmldom';
import type { Document as XmldomDocument } from '@xmldom/xmldom';
import * as xpath from 'xpath';

type Attr = { name: () => string; value: () => string };
type LibxmlNode =
  | {
      attrs: () => Attr[];
      childNodes: () => LibxmlNode[];
      name: () => string;
      text: () => string;
      type: () => 'element';
      get: (localName: string) => WrappedElement | null;
    }
  | {
      type: () => 'text';
      text: () => string;
    };

type WrappedElement = Extract<LibxmlNode, { type: () => 'element' }>;

function wrapText(data: string): Extract<LibxmlNode, { type: () => 'text' }> {
  return {
    type: () => 'text',
    text: () => data,
  };
}

function wrapElement(el: XmldomElement): WrappedElement {
  return {
    attrs: () =>
      Array.from(el.attributes ?? []).map((a) => ({
        name: () => a.name,
        value: () => a.value,
      })),
    childNodes: (): LibxmlNode[] => {
      const out: LibxmlNode[] = [];
      for (let i = 0; i < (el.childNodes?.length ?? 0); i++) {
        const n = el.childNodes.item(i);
        if (!n) continue;
        if (n.nodeType === 1) out.push(wrapElement(n as XmldomElement));
        else if (n.nodeType === 3) out.push(wrapText(n.textContent ?? ''));
      }
      return out;
    },
    name: () => el.localName ?? el.nodeName.replace(/^.*:/, ''),
    text: () => (el.textContent ?? '').trim(),
    type: () => 'element',
    get: (localName: string) => {
      for (let i = 0; i < (el.childNodes?.length ?? 0); i++) {
        const n = el.childNodes.item(i);
        if (n?.nodeType !== 1) continue;
        const ce = n as XmldomElement;
        const ln = ce.localName ?? ce.nodeName.replace(/^.*:/, '');
        if (ln === localName) return wrapElement(ce);
      }
      return null;
    },
  };
}

function wrapDocument(dom: XmldomDocument) {
  const rootEl = (): WrappedElement => {
    const r = dom.documentElement;
    if (!r) throw new Error('Invalid XML: No root element found.');
    return wrapElement(r as XmldomElement);
  };

  const docApi = {
    root: rootEl,
    get(path: string, namespaces: Record<string, string>) {
      const select = xpath.useNamespaces(namespaces);
      const hits = select(path, dom as unknown as Node);
      const node = Array.isArray(hits) ? hits[0] : hits;
      if (!node || typeof (node as Node).nodeType !== 'number' || (node as Node).nodeType !== 1) {
        return null;
      }
      return wrapElement(node as unknown as XmldomElement);
    },
    /** Jest paths do not assert successful XSD matches; production uses native libxml. */
    validate(_xsdDoc: unknown) {
      return true;
    },
    validationErrors: [] as { message: string }[],
  };
  return docApi;
}

function parseXml(xml: string, _options?: { baseUrl?: string }) {
  const dom = new DOMParser().parseFromString(xml.trim(), 'application/xml') as XmldomDocument;
  const err = dom.getElementsByTagName('parsererror')[0];
  if (err?.textContent?.trim()) {
    throw new Error(err.textContent.trim());
  }
  return wrapDocument(dom);
}

const defaultExport = { parseXml };
export default defaultExport;
export { parseXml };
