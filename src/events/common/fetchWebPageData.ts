import * as https from 'https';
import * as url from 'url';
import * as cheerio from 'cheerio';
import { faviconToPng } from './faviconToPng';
import { documentPageIconUrl } from '../../modules/notionModule';

interface WebPageData {
  title: string | null;
  iconUrl: string | null;
}

let iconUrl = '';

export const fetchWebPageData = async (inputUrl: string): Promise<WebPageData> => {
  return new Promise(async (resolve) => {
    https
      .get(inputUrl, (response) => {
        if (response.statusCode !== 200) {
          console.error(`Error: HTTP Status ${response.statusCode}`);
          resolve({ title: null, iconUrl: null });
          return;
        }

        let htmlData = '';

        response.on('data', (chunk) => {
          htmlData += chunk;
        });

        response.on('end', async () => {
          // Cheerioを使ってHTMLをパース
          const $ = cheerio.load(htmlData);

          // ページのタイトルを取得
          const title = $('title').text();

          // ページ内のfaviconを取得
          const faviconHref =
            $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');

          if (faviconHref) {
            const faviconUrl = url.resolve(inputUrl, faviconHref);

            // faviconをPNGに変換して保存
            const convertToPng = faviconToPng(faviconUrl);
            iconUrl = faviconUrl;

            // faviconが取得できない場合、Notionのfaviconを取得
            if (!convertToPng) {
              faviconToPng(documentPageIconUrl);
              iconUrl = documentPageIconUrl;
            }
          }

          resolve({ title, iconUrl });
        });
      })
      .on('error', (error) => {
        console.error(`Error: ${error}`);
        resolve({ title: null, iconUrl: null });
      });
  });
};
