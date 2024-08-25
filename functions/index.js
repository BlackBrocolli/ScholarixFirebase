const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");

const extractors = require("./extractors");

admin.initializeApp();

const websiteConfigs = [
  {
    name: "ScholarshipsDB",
    baseUrl: "https://scholarshipsdb.org/scholarships/",
    listSelector: "h2 a[href]",
    detailExtractor: extractors.scholarshipsDB,
    collection: "scholarships",
    pagination: true,
    maxPages: 3,
  },
  {
    name: "InternationalScholarships",
    baseUrl: "https://www.internationalscholarships.com/scholarships",
    listSelector: "tr a[href]:not(.view-award)",
    detailExtractor: extractors.internationalScholarships,
    collection: "scholarships",
    pagination: true,
    maxPages: 3,
  },
  {
    name: "INDBeasiswa",
    baseUrl: "https://indbeasiswa.com/",
    listSelector: "div.post-entry-inner aside:first-of-type"+
      " h2.entry-title.feat-title a[rel='bookmark']",
    detailExtractor: extractors.indBeasiswa,
    collection: "indonesiaScholarships",
  },
  {
    name: "ScholarshipsForDevelopment",
    baseUrl: "https://www.scholars4dev.com/",
    listSelector: "div.entry.clearfix:has(div.post_column_1:"+
    "contains('Deadline')) h2 a[rel='bookmark']",
    detailExtractor: extractors.scholars4dev,
    collection: "scholarships",
    pagination: true,
    maxPages: 3,
  },
  {
    name: "BoldOrg",
    baseUrl: "https://bold.org/scholarships/",
    listSelector: "a[href*='/scholarships/']:contains('Apply to scholarship')",
    detailExtractor: extractors.boldOrg,
    collection: "scholarships",
    pagination: true,
    maxPages: 15,
  },
];

// exports.scrapeScholarships = functions.runWith({timeoutSeconds: 300})
//     .https.onRequest(async (req, res) => {
exports.scrapeScholarships = functions
    .runWith({timeoutSeconds: 300})
    .pubsub
    .schedule("every 24 hours")
    .onRun(async () => {
      const db = admin.firestore();

      for (const config of websiteConfigs) {
        const scholarships = [];

        if (config.name != "BoldOrg") {
          try {
            const pageLimit = config.maxPages || 1;
            for (let page = 1; page <= pageLimit; page++) {
              console.log(`Page ${page}`);
              const baseUrl = config.pagination ?
              config.name === "ScholarshipsDB" ?
                `${config.baseUrl}?ajax_filter=true&job_page=${page}/` :
                config.name === "ScholarshipsForDevelopment" ?
                  `${config.baseUrl}page/${page}/` :
                  config.name === "InternationalScholarships" ?
                    `${config.baseUrl}?page=${page}&per-page=40` :
                    `${config.baseUrl}${page}/` :
              config.baseUrl;

              const mainPageResponse = await axios.get(baseUrl);
              const $ = cheerio.load(mainPageResponse.data);
              const scholarshipElements = $(config.listSelector);

              // **Modifikasi dimulai di sini**
              // Extract and print the links
              /* const links = [];
              scholarshipElements.each((i, elem) => {
                const href = elem.attribs.href;
                let detailUrl;

                if (config.name === "InternationalScholarships") {
                  detailUrl = "https://www.internationalscholarships.com" + href;
                } else if (config.name === "BoldOrg") {
                  detailUrl = "https://bold.org" + href;
                } else {
                  detailUrl = href;
                }

                links.push(detailUrl);
              });

              res.json({
                message: `Extracted links from ${config.name}`,
                links: links,
              }); */
              // **Modifikasi berakhir di sini**

              const detailPromises = scholarshipElements
                  .map((i, elem) => {
                    const href = elem.attribs.href;
                    let detailUrl;

                    if (config.name === "InternationalScholarships") {
                      detailUrl = "https://www.internationalscholarships.com" + href;
                    } else {
                      detailUrl = href;
                    }

                    return fetchDetailPage(detailUrl, config.detailExtractor);
                  })
                  .get();

              const scholarshipDetails = await Promise.all(detailPromises);
              const validScholarships = scholarshipDetails.filter(
                  (scholarship) => scholarship !== null,
              );
              scholarships.push(...validScholarships);
            }

            const writePromises = scholarships.map((scholarship) => {
              if (scholarship.name != null) {
                let docRef; // Deklarasi di luar blok if-else

                if (config.collection === "indonesiaScholarships") {
                  // Mengubah nama beasiswa untuk digunakan sebagai ID dokumen
                  const docId = scholarship.name.replace(/[/$[\]#]/g, "");
                  docRef = db.collection(config.collection).doc(docId);
                } else {
                  docRef = db.collection(config.collection)
                      .doc(scholarship.name);
                }

                return docRef.set(scholarship);
              }
            });

            await Promise.all(writePromises);
            console.log(`Scholarship data from ${config.name} `+
              `scraped and saved`);
          } catch (error) {
            console.error(
                `Failed to scrape scholarship data from ${config.name}:`,
                error,
            );
          }
        }
      }

      // ini bisa dihapus, hanya untuk emulator
      // res.send("Function executed successfully");
      return null;
    });

// Fungsi scraping khusus untuk web BoldOrg ===================================
// Dipisah karena terlalu banyak makan waktu
// exports.scrapeBoldOrgScholarships = functions.runWith({timeoutSeconds: 300})
//     .https.onRequest(async (req, res) => {
exports.scrapeBoldOrgScholarships = functions
    .runWith({
      timeoutSeconds: 300,
      memory: "1GB",
    })
    .pubsub
    .schedule("every 24 hours")
    .onRun(async () => {
      const db = admin.firestore();

      for (const config of websiteConfigs) {
        const scholarships = [];

        if (config.name == "BoldOrg") {
          try {
            const pageLimit = config.maxPages || 1;
            for (let page = 1; page <= pageLimit; page++) {
              console.log(`Page ${page}`);
              const baseUrl = `${config.baseUrl}${page}/`;

              const mainPageResponse = await axios.get(baseUrl);
              const $ = cheerio.load(mainPageResponse.data);
              const scholarshipElements = $(config.listSelector);

              const detailPromises = scholarshipElements
                  .map((i, elem) => {
                    const href = elem.attribs.href;
                    const detailUrl = "https://bold.org" + href;

                    return fetchDetailPage(detailUrl, config.detailExtractor);
                  })
                  .get();

              const scholarshipDetails = await Promise.all(detailPromises);
              const validScholarships = scholarshipDetails.filter(
                  (scholarship) => scholarship !== null,
              );
              scholarships.push(...validScholarships);
            }

            const writePromises = scholarships.map((scholarship) => {
              if (scholarship.name != null) {
                const docRef = db.collection(config.collection)
                    .doc(scholarship.name);

                return docRef.set(scholarship);
              }
            });

            await Promise.all(writePromises);
            console.log(`Scholarship data from ${config.name} `+
              `scraped and saved`);
          } catch (error) {
            console.error(
                `Failed to scrape scholarship data from ${config.name}:`,
                error,
            );
          }
        }
      }

      // ini bisa dihapus, hanya untuk emulator
      // res.send("Function BoldOrg executed successfully");
      return null;
    });

// Fungsi untuk menghapus beasiswa yang sudah lewat deadline====================
// exports.deleteExpiredScholarships = functions.https
// .onRequest(async (req, res) => {
exports.deleteExpiredScholarships = functions.pubsub
    .schedule("every 24 hours")
    .onRun(async (context) => {
      const now = new Date();
      const scholarshipsRef = admin.firestore().collection("scholarships");
      const snapshot = await scholarshipsRef.get();

      if (snapshot.empty) {
        console.log("No scholarships found.");
        return null;
      }

      snapshot.forEach(async (doc) => {
        const data = doc.data();
        if (data.deadline) {
          const deadlineDate = new Date(data.deadline);
          if (deadlineDate < now) {
            await scholarshipsRef.doc(doc.id).delete();
            console.log(`Deleted expired scholarship: ${doc.id}`);
          }
        }
      });

      // res.send("Expired scholarships have been deleted.");
      return null;
    });

/**
 * Fetches a detail page and extracts details using
 * the provided extractor function.
 *
 * @param {string} url - The URL of the detail page to fetch.
 * @param {Function} detailExtractor - The function to extract details
 * from the loaded page.
 * @return {Promise<Object|null>} A promise that resolves to the extracted
 * details or null if an error occurs.
 */
async function fetchDetailPage(url, detailExtractor) {
  try {
    const detailPageResponse = await axios.get(url);
    const $ = cheerio.load(detailPageResponse.data);
    return detailExtractor($, url);
  } catch (error) {
    console.error(`Error fetching details from ${url}:`, error);
    return null;
  }
}
