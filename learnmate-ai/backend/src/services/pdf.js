import pdf from 'pdf-parse/lib/pdf-parse.js'; // direct import avoids pdf-parse's debug-mode side effect

/** Extract text page by page so every chunk keeps its page number. */
export async function extractPages(buffer) {
  const pages = [];
  let n = 0;
  const data = await pdf(buffer, {
    pagerender: async (pageData) => {
      n += 1;
      const content = await pageData.getTextContent({ normalizeWhitespace: true });
      let text = '', lastY;
      for (const item of content.items) {
        text += lastY === undefined || lastY === item.transform[5] ? item.str : '\n' + item.str;
        lastY = item.transform[5];
      }
      text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      if (text.length > 20) pages.push({ page: n, text });
      return text;
    },
  });
  return { pages, numpages: data.numpages };
}
