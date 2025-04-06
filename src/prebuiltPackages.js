import { getDoc, doc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from './Firebase.js';
import { fetchStockPrices } from './transaction.js';
import { fetchCompanyOverview } from './indyfund.js';

/**
 * Fetches all documents from the defaultpackages collection
 * @param {Object} res - Express response object (optional)
 * @returns {Promise} A promise that resolves to an array of default package objects if no response object is provided
 */
export const fetchAllDefaultPackages = async (res) => {
  const defaultPackagesRef = collection(db, "defaultpackages");

  try {
    const querySnapshot = await getDocs(defaultPackagesRef);
    const packages = [];
    let topSectors = [];
    let prebuilt = [];

    querySnapshot.forEach((doc) => {
      packages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Set sectorBlend as the first package
    // Ensure we're accessing the data correctly - if it has a data property, use that
    let sectorBlend = packages[0];
    // If sectorBlend has a data property that's an array, use that instead
    if (sectorBlend && sectorBlend.data && Array.isArray(sectorBlend.data)) {
      sectorBlend = sectorBlend.data;
    }

    // Add positional entries to topSectors (positions 1, 2, 3)
    if (packages.length > 1) topSectors[0] = packages[1]; // Position 1 (index 0) gets package at index 1
    if (packages.length > 2) topSectors[1] = packages[2]; // Position 2 (index 1) gets package at index 2
    if (packages.length > 3) topSectors[2] = packages[3]; // Position 3 (index 2) gets package at index 3
    topSectors[0].stocks = 20;
    topSectors[1].stocks = 30;
    topSectors[2].stocks = 50;

    // Enhance topSectors with company details for each entry in data array
    topSectors = await Promise.all(topSectors.map(async sectorItem => {
      if (sectorItem.data && Array.isArray(sectorItem.data)) {
        sectorItem = {
          ...sectorItem,
          data: await Promise.all(sectorItem.data.map(async entry => {
            return { ...entry, company: await fetchCompanyOverview(entry.Ticker) };
          }))
        };
      }
      return sectorItem;
    }));

    // Add remaining packages to prebuilt array (starting from index 4) and map with sectors
    if (packages.length > 3) {
      // Get the base prebuilt array
      prebuilt = packages.slice(4);

      // Since sectorBlend is a list of JSON objects with "Vanguard Market Cap ETF" and "Sector" params
      if (sectorBlend && Array.isArray(sectorBlend)) {
        prebuilt = await Promise.all(prebuilt.map(async prebuiltItem => {
          // Look through each item in sectorBlend to find a match for sector data
          for (const blendItem of sectorBlend) {
            if (blendItem["Vanguard Market Cap ETF"] === prebuiltItem.id && blendItem["Sector"]) {
              prebuiltItem = {
                ...prebuiltItem,
                sector: blendItem["Sector"],
                stocks: prebuiltItem.data ? prebuiltItem.data.length : 0,
              };
              break;
            }
          }
          // Iterate over all entries in prebuiltItem.data and enhance each with company details
          if (prebuiltItem.data && Array.isArray(prebuiltItem.data)) {
            prebuiltItem = {
              ...prebuiltItem,
              data: await Promise.all(prebuiltItem.data.map(async entry => {
                return { ...entry, company: await fetchCompanyOverview(entry.Ticker) };
              }))
            };
          }
          return prebuiltItem;
        }));
      }
    }

    // // Enhance topSectors with company details
    // topSectors = await Promise.all(topSectors.map(async pkg => {
    //   return {
    //     ...pkg,
    //     company: await fetchCompanyOverview(pkg.id)
    //   };
    // }));

    // // Enhance prebuilt packages with company details
    // prebuilt = await Promise.all(prebuilt.map(async pkg => {
    //   return {
    //     ...pkg,
    //     company: await fetchCompanyOverview(pkg.id)
    //   };
    // }));

    return {
      topSectors,
      prebuilt
    };
  } catch (error) {
    console.error("Error fetching default packages:", error);
    throw error;
  }
};
