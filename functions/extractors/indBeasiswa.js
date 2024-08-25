/**
 * Extracts scholarship details from an international scholarships site
 * using a cheerio instance and URL.
 *
 * @param {Object} $ - The cheerio instance.
 * @param {string} url - The URL of the scholarship page.
 * @return {Object} An object containing the extracted scholarship details.
 */
function extractDetailsFromINDBeasiswa($, url) {
  const name = $("h1.post-title.entry-title").text().trim();
  const persyaratan = extractPersyaratan($);
  const kontak = extractKontak($); // Placeholder
  const caramendaftar = extractCaraMendaftar($); // Placeholder
  const pilihan = extractPilihan($);
  const tahapan = extractTahapan($); // Placeholder

  return {
    link: url,
    name: name,
    persyaratan: persyaratan,
    kontak: kontak,
    caramendaftar: caramendaftar,
    pilihan: pilihan,
    tahapan: tahapan,
  };
}

/**
 * Extracts the list of options from the scholarship page.
 *
 * @param {Object} $ - The cheerio instance.
 * @return {string[]} An array containing the list of options.
 */
function extractPilihan($) {
  const pilihanArray = [];

  const pilihanHeader = $("h3").filter((index, element) => {
    return $(element).text().trim().startsWith("PILIHAN");
  });

  if (pilihanHeader.length > 0) {
    let nextElement = pilihanHeader.next(); // Ubah dari const menjadi let
    while (nextElement.length && !nextElement.is("h3")) {
      // Jika elemen adalah ul atau ol, ambil isi tag li
      if (nextElement.is("ul") || nextElement.is("ol")) {
        nextElement.find("li").each((i, li) => {
          pilihanArray.push($(li).text().trim());
        });
      }
      nextElement = nextElement.next(); // Lanjut ke elemen berikutnya
    }
  }

  return pilihanArray;
}

/**
 * Extracts the list of requirements from the scholarship page.
 *
 * @param {Object} $ - The cheerio instance.
 * @return {string[]} An array containing the list of requirements.
 */
function extractPersyaratan($) {
  const persyaratanArray = [];

  const persyaratanHeader = $("h3").filter((index, element) => {
    return $(element).text().trim().toLowerCase().startsWith("persyaratan");
  });

  if (persyaratanHeader.length > 0) {
    let nextElement = persyaratanHeader.next(); // Ubah dari const menjadi let
    while (nextElement.length && !nextElement.is("h3")) {
      // Jika elemen adalah ul atau ol, ambil isi tag li
      if (nextElement.is("ul") || nextElement.is("ol")) {
        nextElement.find("li").each((i, li) => {
          persyaratanArray.push($(li).text().trim());
        });
      }
      nextElement = nextElement.next(); // Lanjut ke elemen berikutnya
    }
  }

  return persyaratanArray;
}

/**
 * Extracts the contact information from the scholarship page.
 *
 * @param {Object} $ - The cheerio instance.
 * @return {string[]} An array containing the contact information.
 */
function extractKontak($) {
  const kontakArray = [];

  const kontakHeader = $("h3").filter((index, element) => {
    return $(element).text().trim().toLowerCase().includes("kontak");
  });

  if (kontakHeader.length > 0) {
    const nextElement = kontakHeader.next();
    if (nextElement.is("p")) {
      // Pisahkan teks berdasarkan <br> dan tambahkan ke array
      const htmlContent = nextElement.html();
      const parts = htmlContent.split(/<br\s*\/?>/);

      parts.forEach((part) => {
        // Hapus tag HTML yang tersisa dan trim whitespace
        const text = part.replace(/<\/?[^>]+(>|$)/g, "").trim();
        if (text) {
          kontakArray.push(text);
        }
      });
    }
  }

  return kontakArray;
}

/**
 * Extracts the application process from the scholarship page.
 *
 * @param {Object} $ - The cheerio instance.
 * @return {string[]} An array containing the application process.
 */
function extractCaraMendaftar($) {
  const caramendaftarArray = [];

  const caramendaftarHeader = $("h3").filter((index, element) => {
    const text = $(element).text().trim().toLowerCase();
    return text.includes("cara mendaftar") || text.includes("cara pendaftaran");
  });

  if (caramendaftarHeader.length > 0) {
    let nextElement = caramendaftarHeader.next();
    while (nextElement.length && !nextElement.is("h3")) {
      if (nextElement.is("ul") || nextElement.is("ol")) {
        nextElement.find("li").each((i, li) => {
          caramendaftarArray.push($(li).text().trim());
        });
        break; // Stop after finding the first ul or ol
      }
      nextElement = nextElement.next();
    }
  }

  return caramendaftarArray;
}

/**
 * Extracts the timeline or stages from the scholarship page.
 *
 * @param {Object} $ - The cheerio instance.
 * @return {string[]} An array containing the timeline or stages.
 */
function extractTahapan($) {
  const tahapanArray = [];

  const tahapanHeader = $("h3").filter((index, element) => {
    const text = $(element).text().trim().toLowerCase();
    return text.includes("tahapan") || text.includes("timeline");
  });

  if (tahapanHeader.length > 0) {
    let nextElement = tahapanHeader.next();
    while (nextElement.length && !nextElement.is("h3")) {
      if (nextElement.is("ul") || nextElement.is("ol")) {
        nextElement.find("li").each((i, li) => {
          tahapanArray.push($(li).text().trim());
        });
        break; // Stop after finding the first ul or ol
      }
      nextElement = nextElement.next();
    }
  }

  return tahapanArray;
}

module.exports = extractDetailsFromINDBeasiswa;

