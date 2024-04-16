import { saveNotionLibraryData } from './saveNotionLibraryData';

export const updateNotionLibraryData = (async () => {
  console.log('Updating Library...');
  await saveNotionLibraryData();
  console.log('Library Updated!');
})();
