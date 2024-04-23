import * as https from 'https';
import * as cheerio from 'cheerio';
import * as url from 'url';

interface PageData {
  title: string | null;
  faviconUrl: string | null;
}

export const fetchWebPageData = (inputUrl: string): Promise<PageData> => {
  return new Promise((resolve) => {
    https
      .get(inputUrl, (response) => {
        if (response.statusCode !== 200) {
          console.error(`Error: HTTP Status ${response.statusCode}`);
          resolve({ title: '', faviconUrl: null });
          return;
        }

        let htmlData = '';

        response.on('data', (chunk) => {
          htmlData += chunk;
        });

        response.on('end', () => {
          // Cheerioを使ってHTMLをパース
          const $ = cheerio.load(htmlData);

          // ページのタイトルを取得
          const title = $('title').text();

          // ページ内のfaviconを取得
          const faviconHref =
            $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');

          let faviconUrl: string | null = null;

          if (faviconHref) {
            faviconUrl = url.resolve(inputUrl, faviconHref);
          }

          resolve({ title, faviconUrl });
        });
      })
      .on('error', (err) => {
        console.error('エラー:', err.message);
        resolve({ title: null, faviconUrl: null });
      });
  });
};
