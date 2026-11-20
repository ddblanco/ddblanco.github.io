// Builds cv.docx (English) and cv(esp).docx (Spanish) from cv_data.js.
// Usage: node build_cv.js   (then export_pdf.ps1 writes the PDFs to the site root)
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, Footer, PageNumber, TabStopType, LevelFormat,
  VerticalAlign,
} = require('docx');
const data = require('./cv_data.js');

const FONT = 'Palatino Linotype';
const ACCENT = '1F4E8C';
const GRAY = '666666';
const PAGE_W = 11906, MARGIN = 1080;           // A4, 0.75" margins
const TEXT_W = PAGE_W - 2 * MARGIN;            // 9746
const DATE_W = 2300;
const MAIN_W = TEXT_W - DATE_W;
const SZ = 20, SZ_SMALL = 19;                  // half-points

const UPDATED = { es: 'Actualizado: noviembre de 2026', en: 'Last updated: November 2026' };

function tr(v, lang) {
  if (v == null) return '';
  return typeof v === 'string' ? v : v[lang];
}

// Inline markup -> runs. Supports **bold**, *italic*, [[text]](url) (shown with brackets), [text](url).
function rich(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[\[[^\]]+\]\]\([^)\s]+\)|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0, m;
  const run = (t, extra = {}) => new TextRun({ text: t, font: FONT, size: SZ, ...base, ...extra });
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(run(text.slice(last, m.index)));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(run(tok.slice(2, -2), { bold: true }));
    else if (tok.startsWith('[[')) {
      const [, t, u] = tok.match(/^\[\[([^\]]+)\]\]\(([^)]+)\)$/);
      out.push(link(`[${t}]`, u, base));
    } else if (tok.startsWith('[')) {
      const [, t, u] = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      out.push(link(t, u, base));
    } else out.push(run(tok.slice(1, -1), { italics: true }));
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(run(text.slice(last)));
  return out;
}

function link(text, url, base = {}) {
  return new ExternalHyperlink({
    link: url,
    children: [new TextRun({ text, font: FONT, size: SZ, ...base, color: ACCENT })],
  });
}

const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };

function cell(width, children, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: NONE, bottom: NONE, left: NONE, right: NONE },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    verticalAlign: VerticalAlign.TOP,
    children,
    ...opts,
  });
}

function rowFor(item, lang) {
  const left = [], right = [];
  const date = tr(item.date, lang);
  if (item.type === 'entry') {
    left.push(new Paragraph({ keepNext: true, spacing: { after: item.detail ? 0 : 110 }, children: rich(tr(item.title, lang), { bold: true }) }));
    if (item.detail) left.push(new Paragraph({ spacing: { after: 110 }, children: rich(tr(item.detail, lang), { size: SZ_SMALL }) }));
    right.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: date, font: FONT, size: SZ })] }));
    if (item.note) right.push(new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: tr(item.note, lang), font: FONT, size: SZ_SMALL, italics: true, color: GRAY })] }));
  } else { // line
    const head = tr(item.head, lang), text = tr(item.text, lang);
    left.push(new Paragraph({ spacing: { after: 35 }, children: [
      ...rich(head, { bold: true }),
      ...(text ? [new TextRun({ text: ' — ', font: FONT, size: SZ }), ...rich(text)] : []),
    ] }));
    right.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: date, font: FONT, size: SZ })] }));
  }
  return new TableRow({ cantSplit: true, children: [cell(MAIN_W, left), cell(DATE_W, right)] });
}

function table(rows) {
  return new Table({
    width: { size: TEXT_W, type: WidthType.DXA },
    columnWidths: [MAIN_W, DATE_W],
    borders: NO_BORDERS,
    rows,
  });
}

function sectionHeading(text) {
  return new Paragraph({
    keepNext: true,
    spacing: { before: 220, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '444444', space: 2 } },
    children: [new TextRun({ text, font: FONT, size: 26, bold: true, smallCaps: true })],
  });
}

function build(lang) {
  const children = [];

  // Header
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 },
    children: [new TextRun({ text: data.name, font: FONT, size: 52, smallCaps: true })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: tr(data.tagline, lang), font: FONT, size: 22, italics: true })] }));
  const contact = [];
  data.contact.forEach((c, i) => {
    if (i) contact.push(new TextRun({ text: '  |  ', font: FONT, size: SZ, color: GRAY }));
    contact.push(link(c.text, c.url));
  });
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 30 }, children: contact }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: tr(data.affiliation, lang), font: FONT, size: 17, color: GRAY })] }));

  for (const sec of data.sections) {
    children.push(sectionHeading(tr(sec.title, lang)));
    let rows = [];
    const flush = () => { if (rows.length) { children.push(table(rows)); rows = []; } };
    for (const item of sec.items) {
      if (item.type === 'entry' || item.type === 'line') { rows.push(rowFor(item, lang)); continue; }
      flush();
      if (item.type === 'para') {
        children.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 90 }, children: rich(tr(item.text, lang)) }));
      } else if (item.type === 'bullets') {
        for (const b of item.items) children.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 }, alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60 }, children: rich(tr(b, lang)) }));
      } else if (item.type === 'sub') {
        children.push(new Paragraph({ keepNext: true, spacing: { before: 100, after: 50 },
          children: [new TextRun({ text: tr(item.text, lang), font: FONT, size: SZ, italics: true, color: ACCENT })] }));
      } else if (item.type === 'pub') {
        const runs = [
          ...rich(item.authors), new TextRun({ text: '. ', font: FONT, size: SZ }),
          new TextRun({ text: item.title, font: FONT, size: SZ, italics: true }), new TextRun({ text: '. ', font: FONT, size: SZ }),
          ...rich(item.venue), new TextRun({ text: '. ', font: FONT, size: SZ }),
        ];
        item.links.forEach(([t, u], i) => {
          if (i) runs.push(new TextRun({ text: ' ', font: FONT, size: SZ }));
          runs.push(link(`[${t}]`, u, { size: SZ_SMALL }));
        });
        children.push(new Paragraph({ keepLines: true, spacing: { after: 90 }, children: runs }));
      }
    }
    flush();
  }

  const footer = new Footer({ children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: `${data.name} · ${tr(UPDATED, lang)} · `, font: FONT, size: 16, color: GRAY }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GRAY }),
      new TextRun({ text: ' / ', font: FONT, size: 16, color: GRAY }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: GRAY }),
    ],
  })] });

  return new Document({
    creator: data.name,
    title: `CV – ${data.name}`,
    styles: {
      default: { document: { run: { font: FONT, size: SZ, language: { value: lang === 'es' ? 'es-AR' : 'en-US' } },
                              paragraph: { spacing: { after: 0, line: 240 } } } },
    },
    numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•',
      alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 300, hanging: 220 } } } }] }] },
    sections: [{
      properties: { page: { size: { width: PAGE_W, height: 16838 },
        margin: { top: 900, bottom: 900, left: MARGIN, right: MARGIN, footer: 450 } } },
      footers: { default: footer },
      children,
    }],
  });
}

(async () => {
  for (const [lang, file] of [['en', 'cv.docx'], ['es', 'cv(esp).docx']]) {
    const buf = await Packer.toBuffer(build(lang));
    fs.writeFileSync(path.join(__dirname, file), buf);
    console.log('wrote', file);
  }
})();
