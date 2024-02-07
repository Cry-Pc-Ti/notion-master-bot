import axios from 'axios';
import * as cheerio from 'cheerio';
import { ClipData } from '../types/original/notion';

export const fetchTitleAndFavicon = async (clipData: ClipData) => {
  try {
    // ファビコンタグを取得
    const faviconAddress = 'http://www.google.com/s2/favicons?sz=256&domain=';
    clipData.faviconUrl = faviconAddress + clipData.siteUrl;

    // URLからWebサイトのタイトルを取得
    const response = await axios.get(clipData.siteUrl);
    const $ = cheerio.load(response.data);
    clipData.title = $('title').text();
  } catch (error) {
    console.error('Error Fetching Data:', error);

    return clipData;
  }

  // 取得したタイトルとファビコンURLを返却
  return clipData;
};
