import axios from 'axios';
import * as cheerio from 'cheerio';

interface FetchResult {
  title: string;
  faviconUrl: string | null;
}

export const fetchTitleAndFavicon = async (siteUrl: string) => {
  const fetchResult: FetchResult = { title: '', faviconUrl: null };
  try {
    // URLからWebサイトのタイトルを取得
    const response = await axios.get(siteUrl);
    const $ = cheerio.load(response.data);
    fetchResult.title = $('title').text();
  } catch (error: unknown) {
    if (error instanceof Error) console.error('Error Fetching Data:', error.message);

    return fetchResult;
  }

  // ファビコンタグを取得
  const faviconAddress = 'http://www.google.com/s2/favicons?sz=128&domain=';
  fetchResult.faviconUrl = faviconAddress + siteUrl;

  // 取得したタイトルとファビコンURLを返却
  return fetchResult;
};
