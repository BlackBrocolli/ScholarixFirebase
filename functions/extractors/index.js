const extractDetailsFromScholarshipsDB = require("./scholarshipsDB");
const extractDetailsFromInternationalScholarships = require(
    "./internationalScholarships",
);
const extractDetailsFromINDBeasiswa = require("./indBeasiswa");
const extractDetailsFromScholars4dev = require("./scholars4dev");
const extractDetailsFromBoldOrg = require("./boldOrg");

module.exports = {
  scholarshipsDB: extractDetailsFromScholarshipsDB,
  internationalScholarships: extractDetailsFromInternationalScholarships,
  indBeasiswa: extractDetailsFromINDBeasiswa,
  scholars4dev: extractDetailsFromScholars4dev,
  boldOrg: extractDetailsFromBoldOrg,
};
