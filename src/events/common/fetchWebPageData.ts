import * as https from 'https';
import * as cheerio from 'cheerio';
import * as url from 'url';
import { getInfo, validateURL } from 'yt-stream';

interface PageData {
  title: string | null;
  faviconUrl: string | null;
}

export const fetchWebPageData = (inputUrl: string): Promise<PageData> => {
  // YouTubeのURLの場合
  if (validateURL(inputUrl)) {
    return new Promise((resolve) => {
      getInfo(inputUrl)
        .then((data) => {
          resolve({
            title: data.title,
            faviconUrl: 'https://www.youtube.com/s/desktop/70217e23/img/favicon_32x32.png',
          });
        })
        .catch((error) => {
          console.error('YouTube Error : ', error);
          resolve({ title: null, faviconUrl: null });
        });
    });

    // それ以外のURLの場合
  } else {
    return new Promise((resolve) => {
      https
        .get(inputUrl, (response) => {
          if (response.statusCode !== 200) {
            console.error(`Error: HTTP Status ${response.statusCode}`);
            resolve({ title: null, faviconUrl: null });
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
  }
};
