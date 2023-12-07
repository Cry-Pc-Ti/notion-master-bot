import axios from 'axios';
import { JSDOM } from 'jsdom';
import * as url from 'url';

interface FetchResult {
  title: string;
  faviconUrl: string | null;
}

export const fetchTitleAndFavicon = async (urlToFetch: string): Promise<FetchResult> => {
  try {
    // URLからHTMLを取得
    const response = await axios.get(urlToFetch);
    const html = response.data;

    // HTMLを解析
    const dom = new JSDOM(html);

    // タイトルタグを取得
    const titleTag = dom.window.document.querySelector('title');
    const title = titleTag ? titleTag.textContent || 'No title found' : 'No title found';

    // ファビコンタグを取得
    const faviconTag = dom.window.document.querySelector('link[rel="icon"]');
    let faviconUrl: string | null = null;
    if (faviconTag) {
      faviconUrl = faviconTag.getAttribute('href');
      // 絶対パスに変換
      if (faviconUrl && !faviconUrl.startsWith('http')) {
        const baseURL = new URL(urlToFetch);
        faviconUrl = url.resolve(baseURL.origin, faviconUrl);
      }
    }

    // 取得したタイトルとファビコンURLを返却
    return { title, faviconUrl };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error Fetching Data:', error.message);
      throw error;
    }
  }
};
