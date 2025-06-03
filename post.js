const puppeteer = require("puppeteer");
const fs = require("fs");

const USERNAME = process.env.BEAR_USERNAME;
const PASSWORD = process.env.BEAR_PASSWORD;

const JOURNAL_PATH = "journal.txt";
const POSTED_PATH = "posted.json";
const MICROBLOG_PATH = "micro-blog.html";

// Fail early if credentials aren't set
if (!USERNAME || !PASSWORD) {
  console.error("❌ Missing BEAR_USERNAME or BEAR_PASSWORD");
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  try {
    await page.goto("https://bearblog.dev/accounts/login/?next=/jacksonwhite/dashboard/pages/", {
      waitUntil: "networkidle2"
    });

    await page.waitForSelector("#id_login", { timeout: 10000 });
    await page.type("#id_login", USERNAME);

    await page.waitForSelector("#id_password", { timeout: 10000 });
    await page.type("#id_password", PASSWORD);

    await Promise.all([
      page.click("button[type=submit]"),
      page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    console.log("✅ Logged in to Bear Blog");
  } catch (err) {
    console.error("❌ Login failed:", err);
    await page.screenshot({ path: "debug.png" });
    fs.writeFileSync("debug.html", await page.content());
    await browser.close();
    process.exit(1);
  }

  // Load posted.json
  const posted = fs.existsSync(POSTED_PATH)
    ? JSON.parse(fs.readFileSync(POSTED_PATH, "utf-8"))
    : [];

  // Load journal
  const journal = fs.readFileSync(JOURNAL_PATH, "utf-8");
  const entries = journal.split("---").map(e => e.trim()).filter(Boolean);

  const newEntries = entries.filter(entry => !posted.includes(entry));
  console.log(`📝 Found ${newEntries.length} new post(s)`);

  for (const entry of newEntries) {
    const [titleLine, ...bodyLines] = entry.split("\n");
    const title = titleLine.trim();
    const body = bodyLines.join("\n").trim();

    await page.goto("https://bearblog.dev/dashboard/new/", {
      waitUntil: "networkidle2"
    });

    await page.waitForSelector("input[name=title]");
    await page.type("input[name=title]", title);

    await page.waitForSelector("textarea[name=body]");
    await page.type("textarea[name=body]", body);

    const unlistedCheckbox = await page.$('input[name="listed"]');
    if (unlistedCheckbox) await unlistedCheckbox.click();

    await Promise.all([
      page.click("button[type=submit]"),
      page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    const url = page.url();
    console.log(`✅ Posted: ${title} → ${url}`);

    const linkHTML = `• <a href="${url}" target="_blank">${title}</a><br>\n`;
    fs.appendFileSync(MICROBLOG_PATH, linkHTML);

    posted.push(entry);
    fs.writeFileSync(POSTED_PATH, JSON.stringify(posted, null, 2));
  }

  await browser.close();
})();
