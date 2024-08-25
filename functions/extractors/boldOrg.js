const moment = require("moment");
const {isBefore, parseISO} = require("date-fns");
/**
 * Extracts scholarship details from an international scholarships site
 * using a cheerio instance and URL.
 *
 * @param {Object} $ - The cheerio instance.
 * @param {string} url - The URL of the scholarship page.
 * @return {Object} An object containing the extracted scholarship details.
 */
function extractDetailsFromBoldOrg($, url) {
  const deadlineContainer = $(".mt-7.flex.flex-wrap.justify-between")
      .find("div.mb-5.mr-5")
      .filter(function() {
        return $(this)
            .find("div.mb-2.text-xs.font-medium.uppercase"+
                ".leading-tight.text-gray-600")
            .text()
            .trim() === "Application Deadline";
      });

  const deadlineText = deadlineContainer
      .find("div.text-text.text-sm.font-semibold.leading-tight")
      .text()
      .trim();

  // Use regex to find the pattern with a year
  const yearPattern = /([A-Za-z]{3} \d{1,2}, \d{4})/g;
  const matches = deadlineText.match(yearPattern);

  // Take the first match if found
  const deadlineDate = matches && matches.length > 0 ? matches[0] : "";
  const deadline = moment.utc(deadlineDate, "MMM D, YYYY")
      .format("YYYY-MM-DD");

  if (deadline == "Invalid date" || isBefore(parseISO(deadline), new Date())) {
    return null;
  }

  const title = $("h1.text-text").text().trim();
  const amount = $("div.relative > div.text-text").first().text().trim();

  // Find the 'Eligibility Requirements' section
  const eligibilitySection = $(".text-text.mb-6.text-lg"+
    ".font-semibold.leading-tight")
      .filter(function() {
        return $(this).text().trim() === "Eligibility Requirements";
      }).first();

  // Get the next sibling elements
  const nextSection = eligibilitySection.nextAll(".flex.items-center").first();
  const nextSectionTexts = nextSection
      .find("div.text-text")
      .map((i, el) => $(el)
          .text().trim()).get();

  // Find the index of 'State:' and get the city
  const stateIndex = nextSectionTexts
      .findIndex((text) => text.startsWith("State:"));
  const city = stateIndex >= 0 ? nextSectionTexts[stateIndex + 1] : null;

  // Find the amount container
  const amountContainer = $("div.relative > div.text-text").first().parent();

  // Extract the number of winners
  const numberOfWinnersTexts = amountContainer
      .find(".text-text")
      .map((i, el) => $(el).text().trim())
      .get()
      .filter((text) => text.includes("winner"));

  // console.log("Texts found for winners:", numberOfWinnersTexts);

  // Extract the numbers from the text and find the maximum
  const numberOfWinners = numberOfWinnersTexts.length > 0 ?
    Math.max(...numberOfWinnersTexts.map((text) => {
      const match = text.match(/(\d+)(?:[a-z]{2})?/);
      return match ? parseInt(match[1], 10) : 0;
    })) : "Not specified";

  const descriptionContainer = $("div.text-text.text-lg.break-words");
  const description = descriptionContainer
      .find("p")
      .map((i, el) => $(el).text().trim())
      .get()
      .join("\n");

  // Extract the otherCriteria
  const criteriaSection = $("div.text-text.font-semibold.leading-tight")
      .filter(function() {
        return $(this).text().trim() === "Selection Criteria:";
      }).first();

  // Get the element immediately following the criteriaSection
  const criteriaText = criteriaSection
      .next("div.text-text")
      .text()
      .trim();

  // Extract the education levels
  const educationLevelSection = $("div.text-xs"+
    ".font-medium.uppercase.leading-tight.text-gray-600")
      .filter(function() {
        return $(this).text().trim() === "Education Level";
      }).first();

  const educationLevelsText = educationLevelSection
      .next("div.text-text")
      .text()
      .trim();

  const educationLevels = educationLevelsText
      .split(",")
      .map((level) => level.trim());

  // Map the education levels to the desired values
  const degreesMap = {
    "High School": ["Lainnya"],
    "Undergraduate": ["S1"],
    "Any": ["S1", "S2", "S3", "Lainnya"],
    "Graduate": ["S2"],
  // Add other mappings if needed
  };

  const degrees = [];
  educationLevels.forEach((level) => {
    if (degreesMap[level]) {
      degrees.push(...degreesMap[level]);
    }
  });

  // Extract funded by
  const fundedByText = $(".text-sm.leading-none"+
    ".text-gray-600:contains('Funded by')")
      .next().find(".text-text.flex.items-center"+
        ".text-sm.leading-none.font-bold")
      .text().trim();
  const fundedBy = fundedByText || "Not specified";

  return {
    link: url,
    name: title,
    fundingStatus: null,
    deadline: deadline,
    degrees: degrees,
    city: city,
    country: "United States",
    institution: fundedBy,
    opportunities: numberOfWinners.toString(),
    duration: "",
    languageRequirements: "",
    email: null,
    phone: null,
    eligibleNationals: "Not specified",
    benefitsHtml: [],
    documentsHtml: [],
    // new fields
    description: description,
    otherCriteria: criteriaText,
    amount: amount,
  };
}

module.exports = extractDetailsFromBoldOrg;
