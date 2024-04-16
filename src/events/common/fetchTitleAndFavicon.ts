import axios from 'axios';
import * as cheerio from 'cheerio';
import { ClipData } from '../../types/original/notion';

export const fetchTitleAndFavicon = async (clipData: ClipData) => {
  // ファビコンタグを取得
  const faviconAddress = 'http://www.google.com/s2/favicons?sz=256&domain=';
  clipData.faviconUrl = faviconAddress + clipData.siteUrl;

  try {
    // URLからWebサイトのタイトルを取得
    const response = await axios.get(clipData.siteUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      },
    });
    const $ = cheerio.load(response.data);

    const title = $('title').text();
    if (title) clipData.title = title;

    // 取得したタイトルとファビコンURLを返却
    return clipData;
  } catch (error) {
    if (error instanceof Error) console.error('Error Fetching Data:', error.message);

    return clipData;
  }
};
