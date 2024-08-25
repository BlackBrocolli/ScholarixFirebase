const moment = require("moment");

/**
 * Extracts scholarship details from Scholars4dev website.
 *
 * @param {Object} $ - The cheerio instance.
 * @param {string} url - The URL of the scholarship page.
 * @return {Object} An object containing the extracted scholarship details.
 */
function extractDetailsFromScholars4dev($, url) {
  // Ambil deadline dari div dengan class "post_column_1"
  const deadlineText = $("div.post_column_1")
      .eq(1) // Pilih div kedua untuk deadline
      .text()
      .match(/Deadline:\s*(.*)/);
  const deadline = deadlineText ? cleanDeadline(deadlineText[1]) : "Not"+
  " specified";

  if (deadline == "Not specified") {
    return null;
  }

  // Ambil judul beasiswa
  const title = $("div.post h1").text().trim();

  // Ambil degree dari div dengan class "post_column_1"
  const degreeText = $("div.post_column_1")
      .eq(0) // Pilih div pertama untuk degree
      .find("p").text().trim(); // Ambil teks paragraf dan trim

  // Pisahkan berdasarkan baris baru atau tag <br> dan pilih
  // bagian yang berisi "Degree"
  const degreeLines = degreeText.split(/\n|<br\s*\/?>/i);
  const degreeLine = degreeLines.find((line) => line.includes("Degree")).trim();

  // Hapus "Degree" dan pisahkan berdasarkan "/"
  const degreeInfo = degreeLine
      .replace(/Degree/g, "")
      .split("/")
      .map((d) => d.trim());

  const institutionText = $("p:contains('Host Institution(s):')")
      .next("p").text().trim();

  // Ambil informasi negara dan kota dari div dengan class "post_column_1"
  const locationText = $("div.post_column_1")
      .eq(1) // Pilih div kedua
      .text()
      .match(/Study in:\s*(.*)/);
  const location = locationText ? locationText[1].trim() : "Not specified";

  let city = null;
  let country = null;

  if (location.includes(",")) {
    const [cityPart, countryPart] = location.split(",")
        .map((part) => part.trim());
    city = cityPart;
    country = countryPart;
  } else {
    country = location;
  }

  // Ambil informasi jumlah beasiswa
  const opportunitiesText = $("p:contains('Number of Scholarships:'),"+
    " p:contains('Number of Awards:')")
      .next("p")
      .text()
      .trim();
  const numberOfOpportunities = opportunitiesText ? opportunitiesText : "Not"+
  " specified";

  // Ambil deskripsi beasiswa
  const descriptionText = $("p:contains('Brief description:')")
      .next("p")
      .text()
      .trim();

  // Ambil informasi otherCriteria
  let otherCriteria = "";
  const eligibilityElement = $("p:contains('Eligibility:')");
  if (eligibilityElement.length) {
    const elements = eligibilityElement.nextUntil("p:"+
        "contains('Application instructions:')");
    otherCriteria = elements.text().trim();
  }

  // Ambil informasi fundingStatus
  const fundingStatusElement = $("div.post_column_1")
      .find("p em")
      .first()
      .text()
      .trim();
  const fundingStatus = fundingStatusElement ? fundingStatusElement : "Not"+
  " specified";

  return {
    link: url,
    name: title,
    fundingStatus: fundingStatus,
    deadline: deadline,
    degrees: mapDegrees(degreeInfo),
    city: city,
    country: country,
    institution: institutionText,
    opportunities: numberOfOpportunities,
    description: descriptionText,
    duration: "",
    languageRequirements: "",
    email: null,
    phone: null,
    eligibleNationals: "Check the scholarship website for eligibility details.",
    benefitsHtml: [],
    documentsHtml: [],
    // new fields
    otherCriteria: otherCriteria,
    amount: "",
  };
}

/**
 * Cleans the deadline text by removing any references
 * to "annual" and similar terms, and converting to yyyy-MM-dd format.
 *
 * @param {string} deadline - The raw deadline text.
 * @return {string} The cleaned deadline text in yyyy-MM-dd format.
 */
function cleanDeadline(deadline) {
  const cleanedDeadline = deadline.replace(/\s*\(.*annual.*\)/i, "").trim();

  // Format tanggal sederhana
  const simpleDate = moment(
      cleanedDeadline, ["D MMM YYYY", "DD MMM YYYY"], true,
  );
  if (simpleDate.isValid()) {
    return simpleDate.format("YYYY-MM-DD");
  }

  // Format tanggal dengan dua tanggal
  const splitDate = cleanedDeadline.split("/").pop().trim();
  const splitDateFormatted = moment(
      splitDate, ["D MMM YYYY", "DD MMM YYYY"], true,
  );
  if (splitDateFormatted.isValid()) {
    return splitDateFormatted.format("YYYY-MM-DD");
  }

  // Format bulan rentang
  const rangeMatch = cleanedDeadline.match(/([A-Za-z]+)-([A-Za-z]+) (\d{4})/);
  if (rangeMatch) {
    const monthEnd = rangeMatch[2];
    const year = rangeMatch[3];
    const endDate = moment(`1 ${monthEnd} ${year}`, "D MMM YYYY")
        .endOf("month");
    return endDate.format("YYYY-MM-DD");
  }

  // Default jika tidak bisa diparsing
  return "Not specified";
}

/**
 * Maps degree descriptions to their corresponding codes.
 *
 * @param {Array} degrees - An array of degree descriptions.
 * @return {Array} An array of mapped degree codes.
 */
function mapDegrees(degrees) {
  return degrees.map((degree) => {
    switch (degree.trim()) {
      case "Bachelors":
        return "S1";
      case "Masters":
        return "S2";
      case "PhD":
        return "S3";
      default:
        return "Lainnya";
    }
  });
}

module.exports = extractDetailsFromScholars4dev;
