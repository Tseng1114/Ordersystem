import { access, readFile, readdir } from "node:fs/promises";
import process from "node:process";

const seedRows = JSON.parse(await readFile(new URL("../shop-catalog-seed.json", import.meta.url), "utf8"));
const { SHOPS } = await import("../shop-data.js");

const menuRootUrl = new URL("../public/menus/", import.meta.url);
const problems = [];
const missingOfficialUrlShops = [];

function addProblem(type, message) {
  problems.push({ type, message });
}

async function fileExists(fileUrl) {
  try {
    await access(fileUrl);
    return true;
  } catch {
    return false;
  }
}

function findDuplicates(items) {
  return items.filter((item, index, array) => array.indexOf(item) !== index);
}

function auditSeedRows() {
  const shopKeys = new Set(Object.keys(SHOPS));
  const seedKeys = new Set();

  for (const row of seedRows) {
    seedKeys.add(row.key);

    if (!shopKeys.has(row.key)) {
      addProblem("missing-shop-data", `${row.key} exists in shop-catalog-seed.json but not shop-data.js`);
    }

    const menuItems = Array.isArray(row.menuItems) ? row.menuItems : [];
    const addonOptions = Array.isArray(row.addonOptions) ? row.addonOptions : [];
    const duplicateItems = findDuplicates(menuItems);
    const duplicateAddons = findDuplicates(addonOptions);
    const combinedItems = menuItems.filter((item) => item.includes("、") || item.includes("，"));

    if (row.category === "drink" && menuItems.length === 0) {
      addProblem("empty-drink-items", `${row.key} (${row.name}) has no drink menu items`);
    }

    const shop = SHOPS[row.key];
    if (!shop?.url) {
      missingOfficialUrlShops.push(`${row.key} (${row.name})`);
    }

    if (duplicateItems.length > 0) {
      addProblem("duplicate-items", `${row.key} has duplicate items: ${duplicateItems.join(", ")}`);
    }

    if (duplicateAddons.length > 0) {
      addProblem("duplicate-addons", `${row.key} has duplicate addons: ${duplicateAddons.join(", ")}`);
    }

    if (combinedItems.length > 0) {
      addProblem("combined-items", `${row.key} may contain combined items: ${combinedItems.join(", ")}`);
    }
  }

  for (const [shopKey, shop] of Object.entries(SHOPS)) {
    if (!seedKeys.has(shopKey)) {
      addProblem("missing-seed", `${shopKey} (${shop.name}) exists in shop-data.js but not shop-catalog-seed.json`);
    }
  }
}

async function auditMenuImages() {
  const referencedImages = new Set();

  for (const [shopKey, shop] of Object.entries(SHOPS)) {
    const menuDir = shop.category === "drink" ? "drinks" : "meals";

    for (const imageName of shop.imgs || []) {
      referencedImages.add(`${menuDir}/${imageName}`);
      const imageUrl = new URL(`${menuDir}/${imageName}`, menuRootUrl);

      if (!(await fileExists(imageUrl))) {
        addProblem("missing-menu-image", `${shopKey} references missing image: public/menus/${menuDir}/${imageName}`);
      }
    }
  }

  for (const menuDir of ["drinks", "meals"]) {
    const dirUrl = new URL(`${menuDir}/`, menuRootUrl);
    const imageNames = await readdir(dirUrl);

    for (const imageName of imageNames) {
      const imagePath = `${menuDir}/${imageName}`;
      if (!referencedImages.has(imagePath)) {
        addProblem("unused-menu-image", `public/menus/${imagePath} is not referenced by shop-data.js`);
      }
    }
  }
}

auditSeedRows();
await auditMenuImages();

if (problems.length === 0) {
  console.log("Shop catalog audit passed.");
  if (missingOfficialUrlShops.length > 0) {
    console.log(`${missingOfficialUrlShops.length} shop(s) fall back to search links because official URLs are not set.`);
  }
  process.exit(0);
}

console.error(`Shop catalog audit found ${problems.length} problem(s):`);
for (const problem of problems) {
  console.error(`- [${problem.type}] ${problem.message}`);
}
process.exit(1);
