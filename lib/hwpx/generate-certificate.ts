/* eslint-disable @typescript-eslint/no-explicit-any */
import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { readFile } from "fs/promises";
import { join } from "path";

const HP_NS = "http://www.hancom.co.kr/hwpml/2011/paragraph";

export interface CertificateInput {
  issueNumber: string;
  businessName: string;
  areaM2: string;
  areaM3: string;
  address: string;
  position: string;
  managerName: string;
  periodStart: string;
  periodEnd: string;
  disinfectionType: string;
  chemicals: string;
  year: string;
  month: string;
  day: string;
  operatorName: string;
  operatorAddress: string;
  operatorCeo: string;
}

type XNode = any;

function getElementsNS(parent: XNode, ns: string, localName: string): XNode[] {
  const nodeList = parent.getElementsByTagNameNS(ns, localName);
  const result: XNode[] = [];
  for (let i = 0; i < nodeList.length; i++) {
    result.push(nodeList.item(i));
  }
  return result;
}

function getCellParagraphs(tc: XNode): XNode[] {
  const subLists = getElementsNS(tc, HP_NS, "subList");
  if (subLists.length === 0) return [];
  return getElementsNS(subLists[0], HP_NS, "p");
}

function getRuns(p: XNode): XNode[] {
  const result: XNode[] = [];
  const children = p.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children.item(i);
    if (child.localName === "run" && child.namespaceURI === HP_NS) {
      result.push(child);
    }
  }
  return result;
}

function setRunText(run: XNode, text: string): void {
  const tElements = getElementsNS(run, HP_NS, "t");
  const doc = run.ownerDocument;
  if (tElements.length > 0) {
    const t = tElements[0];
    // 기존 자식 노드 모두 제거 후 새 텍스트 노드 추가
    while (t.firstChild) t.removeChild(t.firstChild);
    t.appendChild(doc.createTextNode(text));
  } else {
    const t = doc.createElementNS(HP_NS, "hp:t");
    t.appendChild(doc.createTextNode(text));
    run.appendChild(t);
  }
}

function makeRun(doc: XNode, text: string, charPrIDRef: string): XNode {
  const run = doc.createElementNS(HP_NS, "hp:run");
  run.setAttribute("charPrIDRef", charPrIDRef);
  const t = doc.createElementNS(HP_NS, "hp:t");
  t.textContent = text;
  run.appendChild(t);
  return run;
}

function appendRunToPara(p: XNode, text: string, charPrIDRef: string): void {
  const doc = p.ownerDocument;
  const newRun = makeRun(doc, text, charPrIDRef);

  // linesegarray 앞에 삽입
  const children = p.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children.item(i);
    if (child.localName === "linesegarray" && child.namespaceURI === HP_NS) {
      p.insertBefore(newRun, child);
      return;
    }
  }
  p.appendChild(newRun);
}

export async function generateCertificateHwpx(input: CertificateInput): Promise<Buffer> {
  // 1. 템플릿 읽기
  const templatePath = join(process.cwd(), "lib", "template", "소독증명서_템플릿.hwpx");
  const templateBuffer = await readFile(templatePath);
  const zip = await JSZip.loadAsync(templateBuffer);

  // 2. section0.xml 파싱
  const sectionFile = zip.file("Contents/section0.xml");
  if (!sectionFile) throw new Error("section0.xml not found in template");
  const xmlStr = await sectionFile.async("string");

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, "text/xml");
  const root = doc.documentElement;

  // 3. 셀 목록 수집
  const cells = getElementsNS(root, HP_NS, "tc");

  // --- cell[1]: 증명서 번호 ---
  const paras1 = getCellParagraphs(cells[1]);
  const runs1 = getRuns(paras1[1]);
  setRunText(runs1[0], ` 제    ${input.issueNumber}   호`);

  // --- cell[3]: 상호(명칭) ---
  const paras3 = getCellParagraphs(cells[3]);
  appendRunToPara(paras3[1], input.businessName, "6");

  // --- cell[4]: 면적/용적 ---
  const paras4 = getCellParagraphs(cells[4]);
  const runs4 = getRuns(paras4[1]);
  setRunText(runs4[0], `            ${input.areaM2}  `);
  if (input.areaM3) {
    setRunText(runs4[2], `(    ${input.areaM3}  ㎥)`);
  }

  // --- cell[5]: 소재지 ---
  const paras5 = getCellParagraphs(cells[5]);
  const runs5 = getRuns(paras5[1]);
  setRunText(runs5[0], "                         ");
  appendRunToPara(paras5[1], input.address, "25");

  // --- cell[7]: 직위 ---
  const paras7 = getCellParagraphs(cells[7]);
  appendRunToPara(paras7[1], input.position, "25");

  // --- cell[8]: 성명 ---
  const paras8 = getCellParagraphs(cells[8]);
  appendRunToPara(paras8[1], input.managerName, "6");

  // --- cell[12]: 소독기간 ---
  const paras12 = getCellParagraphs(cells[12]);
  const runs12 = getRuns(paras12[0]);
  setRunText(runs12[0], `${input.periodStart} ~ ${input.periodEnd}`);

  // --- cell[15]: 종류 ---
  const paras15 = getCellParagraphs(cells[15]);
  const runs15 = getRuns(paras15[1]);
  setRunText(runs15[0], `                      ${input.disinfectionType}`);

  // --- cell[16]: 약품 ---
  const paras16 = getCellParagraphs(cells[16]);
  const runs16 = getRuns(paras16[1]);
  setRunText(runs16[0], `                      ${input.chemicals}`);

  // --- cell[17]: 날짜 ---
  const paras17 = getCellParagraphs(cells[17]);
  const runs17 = getRuns(paras17[3]);
  setRunText(runs17[0], `${input.year} 년      ${input.month} 월     ${input.day} 일`);

  // --- cell[19]: 소독실시자 ---
  const paras19 = getCellParagraphs(cells[19]);
  setRunText(getRuns(paras19[0])[0], input.operatorName);
  setRunText(getRuns(paras19[1])[0], input.operatorAddress);
  setRunText(getRuns(paras19[2])[0], `    ${input.operatorCeo}  `);

  // 4. XML 직렬화
  const serializer = new XMLSerializer();
  const outputXml = serializer.serializeToString(doc);

  // 5. ZIP 재생성
  zip.file("Contents/section0.xml", outputXml);
  const outputBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return outputBuffer;
}
