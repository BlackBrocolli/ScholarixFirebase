const {format, parse, isBefore} = require("date-fns");

/**
 * Extracts scholarship details from a given database using
 * a cheerio instance and URL.
 *
 * @param {Object} $ - The cheerio instance.
 * @param {string} url - The URL of the scholarship page.
 * @return {Object} An object containing the extracted scholarship details.
 */
function extractDetailsFromScholarshipsDB($, url) {
  let deadline = $("li")
      .filter(function() {
        return $(this).text().trim().startsWith("Apply Before");
      })
      .text()
      .split(":")[1]
      .trim();

  deadline = format(parse(deadline, "MMMM d, yyyy", new Date()), "yyyy-MM-dd");

  // Check if deadline is before today
  const today = new Date();
  const deadlineDate = parse(deadline, "yyyy-MM-dd", new Date());
  if (isBefore(deadlineDate, today)) {
    return null;
  }

  const title = $("figcaption h2").text().trim();
  const fundingStatus = $("figcaption span small a").first().text().trim();

  const degreeInfo = $("ul.jobsearch-row li")
      .filter(function() {
        return $(this).find("span").text().trim() === "Degree/Level";
      })
      .find("small")
      .map((i, el) => $(el).text().trim())
      .get();

  const opportunitiesText = $("ul.jobsearch-row li")
      .filter(function() {
        return $(this).find("span").text().trim() === "No of Opportunities";
      })
      .find("small")
      .text()
      .trim();

  const numberOfOpportunities = opportunitiesText || "N/A";
  const duration = $("ul.jobsearch-row li")
      .filter(function() {
        return $(this).find("span").text().trim() === "Duration";
      })
      .find("small")
      .text()
      .trim();

  const languageRequirements = $("ul.jobsearch-row li")
      .filter(function() {
        return $(this).find("span").text().trim() === "Language Requirement";
      })
      .find("small")
      .text()
      .trim();

  const locationText = $("figcaption ul.jobsearch-jobdetail-options li")
      .first()
      .text()
      .trim()
      .replace(" View on Map", "");
  const locationParts = locationText.split(",").map((part) => part.trim());
  const [city, country] =
    locationParts.length > 1 ? locationParts : [null, locationParts[0]];

  const institutionName = $("li:contains(Host Institution)")
      .text()
      .split(":")[1]
      .trim();

  const contactSection = $("h2")
      .filter(function() {
        return $(this).text().trim().toLowerCase().includes("contacts");
      })
      .nextUntil("h2");

  let email = null;
  let phone = null;

  contactSection.each(function() {
    const textContent = $(this).text();
    if (
      !email &&
      (textContent.toLowerCase().includes("email") ||
        textContent.toLowerCase().includes("e-mail"))
    ) {
      const emailMatch = textContent.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        email = emailMatch[0];
      }
    }
    if (
      !phone &&
      (textContent.toLowerCase().includes("tel no") ||
        textContent.toLowerCase().includes("phone no"))
    ) {
      const phoneMatch = textContent.match(/\+?\d[\d -]{8,12}\d/);
      if (phoneMatch) {
        phone = phoneMatch[0];
      }
    }
  });

  const summarySection = $("h2")
      .filter(function() {
        return /Summary of this scholarship in .*/i.test($(this).text());
      })
      .nextAll("ul")
      .first();

  let eligibleNationals = "Not specified";

  summarySection.children("li").each(function() {
    const liText = $(this).text();
    if (liText.startsWith("Eligible nationals:")) {
      eligibleNationals = /check eligible nationals/i.test(liText) ?
        "Not specified" :
        liText.split(":")[1].trim();
      return false;
    }
  });

  const benefitsHeader = $("h2")
      .filter((i, el) => {
        return $(el).text().trim().startsWith("Benefits");
      })
      .first();

  const benefitsContent = extractBenefitsContent($, benefitsHeader);

  const documentsHeader = $("h2")
      .filter((i, el) => {
        return $(el).text().trim().startsWith("Required documents");
      })
      .first();

  let documentsContent = [];
  if (documentsHeader.length > 0) {
    documentsContent = extractDocumentsContent($, documentsHeader);
  }

  return {
    link: url,
    name: title,
    fundingStatus: fundingStatus,
    deadline: deadline,
    degrees: mapDegrees(degreeInfo),
    city: city,
    country: country,
    institution: institutionName,
    opportunities: numberOfOpportunities,
    duration: duration,
    languageRequirements: languageRequirements,
    email: email,
    phone: phone,
    eligibleNationals: eligibleNationals,
    benefitsHtml: benefitsContent,
    documentsHtml: documentsContent,
    // new fields
    description: "",
    otherCriteria: "",
    amount: "",
  };
}

/**
 * Extracts benefits content from the scholarship page starting from
 * a specific element.
 *
 * @param {Object} $ - The cheerio instance.
 * @param {Object} startElement - The cheerio element to start extracting from.
 * @return {Array} An array of HTML strings representing the benefits content.
 */
function extractBenefitsContent($, startElement) {
  const contents = [];
  let currentElement = startElement.next();

  while (currentElement.length > 0) {
    if (
      currentElement.is("h2, h3") ||
      (currentElement.is("p") &&
        currentElement.text().trim().startsWith("What are the required"))
    ) {
      break;
    }
    contents.push(currentElement.prop("outerHTML"));
    currentElement = currentElement.next();
  }

  return contents;
}

/**
 * Extracts documents content from the scholarship page starting from
 * a specific element.
 *
 * @param {Object} $ - The cheerio instance.
 * @param {Object} startElement - The cheerio element to start extracting from.
 * @return {Array} An array of strings representing the required documents.
 */
function extractDocumentsContent($, startElement) {
  const contents = [];

  const firstUl = startElement.nextAll("ul").first();
  if (!firstUl.length) return contents;

  firstUl.find("li").each((index, li) => {
    const text = $(li).text().trim();
    if (text) contents.push(text);
  });

  return contents;
}

/**
 * Maps degree descriptions to their corresponding codes.
 *
 * @param {Array} degrees - An array of degree descriptions.
 * @return {Array} An array of mapped degree codes.
 */
function mapDegrees(degrees) {
  return degrees.map((degree) => {
    switch (degree) {
      case "Bachelor/Undergraduate":
        return "S1";
      case "Master/Postgraduate":
        return "S2";
      case "Ph.D./Doctoral":
        return "S3";
      default:
        return "Lainnya";
    }
  });
}

module.exports = extractDetailsFromScholarshipsDB;
