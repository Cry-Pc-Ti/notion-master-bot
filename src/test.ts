import * as https from 'https';
import * as cheerio from 'cheerio';
import * as url from 'url';

interface PageData {
  title: string;
  faviconUrl: string | null;
}

const getPageData = (inputUrl: string): Promise<PageData> => {
  return new Promise((resolve, reject) => {
    https
      .get(inputUrl, (res) => {
        if (res.statusCode !== 200) {
          console.error(`HTTP ステータスコードが ${res.statusCode} です。`);
          resolve({ title: '', faviconUrl: null });
          return;
        }

        let htmlData = '';

        res.on('data', (chunk) => {
          htmlData += chunk;
        });

        res.on('end', () => {
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
        resolve({ title: '', faviconUrl: null });
      });
  });
};

// 使用例
const targetUrl = 'https://www.youtube.com/watch?v=TOgTSBBFbFE';
getPageData(targetUrl)
  .then((pageData) => {
    console.log('タイトル:', pageData.title);
    if (pageData.faviconUrl) {
      console.log('faviconのURL:', pageData.faviconUrl);
    } else {
      console.log('faviconが見つかりませんでした。');
    }
  })
  .catch((err) => {
    console.error('エラー:', err);
  });
