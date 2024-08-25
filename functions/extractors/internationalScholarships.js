const {isBefore, parseISO} = require("date-fns");
const monthMapping = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};

/**
 * Extracts scholarship details from an international scholarships site
 * using a cheerio instance and URL.
 *
 * @param {Object} $ - The cheerio instance.
 * @param {string} url - The URL of the scholarship page.
 * @return {Object} An object containing the extracted scholarship details.
 */
function extractDetailsFromInternationalScholarships($, url) {
  // ~~~ Start of Deadline ~~~
  let deadline = $("div.clear h4:contains('Deadline')").next("p").text().trim();

  // Convert the deadline to yyyy-MM-dd format
  const deadlineParts = deadline.split(" ");
  let year; let month; let day;

  if (deadlineParts.length === 2) {
    // Format: June 30
    year = "2024"; // Default year
    const [monthName, dayStr] = deadlineParts;
    month = monthMapping[monthName];
    if (month) {
      day = dayStr.replace(",", "").replace(/(st|nd|rd|th)$/, "");
      deadline = `${year}-${month}-${day.padStart(2, "0")}`;
    } else {
      deadline = ""; // Handle cases where the month is not found
    }
  } else if (deadlineParts.length === 3) {
    // Format: January 31, 2024
    const [monthName, dayStr, year] = deadlineParts;
    month = monthMapping[monthName];
    if (month) {
      day = dayStr.replace(",", "").replace(/(st|nd|rd|th)$/, "");
      deadline = `${year}-${month}-${day.padStart(2, "0")}`;
    } else {
      deadline = ""; // Handle cases where the month is not found
    }
  } else {
    // Handle cases where the date is in a different format (e.g., 2024-10-15th)
    const datePattern = /^(\d{4})-(\d{2})-(\d{2})(st|nd|rd|th)?$/;
    const match = deadline.match(datePattern);
    if (match) {
      year = match[1];
      month = match[2];
      day = match[3];
      deadline = `${year}-${month}-${day}`;
    } else {
      deadline = ""; // Handle invalid date formats
    }
  }

  // Validate the final deadline format
  const finalDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!finalDatePattern.test(deadline)) {
    return null;
  }

  // Check if the deadline is invalid or has passed
  if (deadline === "" || isBefore(parseISO(deadline), new Date())) {
    return null;
  }
  // ~~~ End of Deadline ~~~

  const amount = $("div.clear h4:contains('Amount')").next("p").text().trim();
  if (amount.toLowerCase() === "variable" ||
  amount.toLowerCase() === "varies") {
    return null;
  }

  const title = $(".title").text().trim();

  const countrySelector =
  "div.clear h4:contains('You must be studying " +
  "in one of the following countries:')";
  const country = $(countrySelector)
      .next("p")
      .text()
      .trim();

  const institution = $("div.clear h4:contains('Host Institution')")
      .next("p")
      .text()
      .trim();
  const opportunities = $("div.clear h4:contains('Number of Awards')")
      .next("p")
      .text()
      .trim();
  const eligibleNationals = $(
      "div.clear h4:contains('You must be from one "+
      "of the following countries:')",
  )
      .next("p")
      .text()
      .trim();
  const description = $("div.award-description h2:contains('Description')")
      .next("p")
      .text()
      .trim();
  const otherCriteria = $("div.award-description h2:contains('Other Criteria')")
      .next("p")
      .text()
      .trim();

  return {
    link: url,
    name: title,
    fundingStatus: null,
    deadline: deadline,
    degrees: [],
    city: null,
    country: country,
    institution: institution,
    opportunities: opportunities,
    duration: "",
    languageRequirements: "",
    email: null,
    phone: null,
    eligibleNationals: eligibleNationals,
    benefitsHtml: [],
    documentsHtml: [],
    // new fields
    description: description,
    otherCriteria: otherCriteria,
    amount: amount,
  };
}

module.exports = extractDetailsFromInternationalScholarships;
