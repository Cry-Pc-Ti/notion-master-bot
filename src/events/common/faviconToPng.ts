import * as path from 'path';
import axios from 'axios';
import fs from 'fs';
import sharp from 'sharp';
import ico from 'sharp-ico';
import { PNG } from 'pngjs';

export const faviconToPng = async (faviconUrl: string): Promise<boolean> => {
  try {
    const faviconResponse = await axios.get(faviconUrl, { responseType: 'arraybuffer' });
    const fileExtension = path.extname(faviconUrl);

    const outputTempFile = path.join(__dirname, `../../../static/img/temp_favicon.png`);
    const outputFile = path.join(__dirname, `../../../static/img/favicon.png`);
    fs.unlinkSync(outputTempFile);

    // iconファイルの場合
    if (fileExtension === '.ico') {
      // icoをpngに変換し一時ファイルに保存
      try {
        const faviconImage = ico.decode(faviconResponse.data)[0];
        const png = new PNG({ width: faviconImage.width, height: faviconImage.height });
        png.data = Buffer.from(faviconImage.data);
        png.pack().pipe(fs.createWriteStream(outputTempFile));
      } catch (error) {
        console.error('Error saving favicon:', error);
        return false;
      }

      // 32x32にリサイズ
      const faviconBuffer = fs.readFileSync(outputTempFile);
      await sharp(Buffer.from(faviconBuffer))
        .resize(32, 32)
        .toFile(outputFile)
        .catch((error) => {
          console.error('Error saving favicon:', error);
          return false;
        });

      // 一時ファイルを削除
      fs.unlinkSync(outputTempFile);

      // icoファイル以外の場合
    } else {
      // 32x32にリサイズしてPNGに変換
      await sharp(Buffer.from(faviconResponse.data))
        .resize(32, 32)
        .png()
        .toFile(outputFile)
        .catch((error) => {
          console.error('Error saving favicon:', error);
          return false;
        });
    }

    return true;
  } catch (error) {
    console.error('Error saving favicon:', error);
    return false;
  }
};
