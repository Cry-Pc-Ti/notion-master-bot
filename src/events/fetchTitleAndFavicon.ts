import axios from 'axios';
import * as cheerio from 'cheerio';
import { ClipData } from '../types/original/notion';

export const fetchTitleAndFavicon = async (clipData: ClipData) => {
  // ファビコンタグを取得
  const faviconAddress = 'http://www.google.com/s2/favicons?sz=256&domain=';
  clipData.faviconUrl = faviconAddress + clipData.siteUrl;

  try {
    // URLからWebサイトのタイトルを取得
    const response = await axios.get(clipData.siteUrl);

    const $ = cheerio.load(response.data);

    const title = $('title').text();
    if (title) clipData.title = title;

    // 取得したタイトルとファビコンURLを返却
    return clipData;
  } catch (error) {
    console.error('Error Fetching Data:', error);

    clipData.title = '';
    return clipData;
  }
};
