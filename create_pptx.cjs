const pptxgen = require("pptxgenjs");
const path = require("path");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "OpenAI Codex";
pptx.company = "OpenAI";
pptx.subject = "Project Viva Presentation";
pptx.title = "Aachi Vanthachu Project Viva";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};

const OUT = path.join(__dirname, "Aachi_Vanthachu_Project_Viva_Presentation.pptx");
const LOGO = path.join(__dirname, "electron", "logo.png");

const C = {
  bg: "081126",
  bg2: "102041",
  card: "F4F7FB",
  cardDark: "16264A",
  text: "1A2333",
  muted: "5E6A80",
  light: "F8FAFC",
  accent: "21C6B3",
  accent2: "FFB84D",
  accent3: "5B7DFF",
  success: "20AB62",
  danger: "E05157",
  line: "D6DDE8",
};

function addBg(slide, dark = true) {
  slide.background = { color: dark ? C.bg : "FAFBFD" };
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 10.6,
    y: -0.9,
    w: 3.4,
    h: 3.4,
    fill: { color: dark ? C.accent3 : "DCEAFF", transparency: dark ? 74 : 38 },
    line: { color: dark ? C.accent3 : "DCEAFF", transparency: 100 },
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: -0.65,
    y: 5.55,
    w: 2.45,
    h: 2.45,
    fill: { color: dark ? C.accent : "D3F7F1", transparency: dark ? 78 : 35 },
    line: { color: dark ? C.accent : "D3F7F1", transparency: 100 },
  });
}

function addLogo(slide) {
  slide.addImage({ path: LOGO, x: 11.55, y: 0.35, h: 0.62 });
}

function addTitle(slide, title, subtitle = "", dark = false) {
  slide.addText(title, {
    x: 0.7,
    y: 0.42,
    w: 9.7,
    h: 0.45,
    fontFace: "Aptos Display",
    fontSize: 26,
    bold: true,
    color: dark ? C.light : C.text,
    margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.72,
      y: 1.05,
      w: 11.0,
      h: 0.25,
      fontFace: "Aptos",
      fontSize: 11.5,
      color: dark ? "D2DBE8" : C.muted,
      margin: 0,
    });
  }
}

function addFooter(slide, text, dark = false) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.7,
    y: 7.02,
    w: 11.95,
    h: 0.02,
    fill: { color: dark ? "435577" : C.line },
    line: { color: dark ? "435577" : C.line, transparency: 100 },
  });
  slide.addText(text, {
    x: 0.72,
    y: 7.05,
    w: 5,
    h: 0.18,
    fontSize: 9,
    color: dark ? "C2CBDB" : C.muted,
    margin: 0,
  });
}

function addCard(slide, x, y, w, h, opts = {}) {
  const { title, dark = false, accent } = opts;
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    fill: { color: dark ? C.cardDark : C.card },
    line: { color: dark ? "35486C" : C.line, pt: 1 },
  });
  if (accent) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.14,
      y: y + 0.15,
      w: 0.1,
      h: h - 0.3,
      rectRadius: 0.04,
      fill: { color: accent },
      line: { color: accent, transparency: 100 },
    });
  }
  if (title) {
    slide.addText(title, {
      x: x + 0.3,
      y: y + 0.18,
      w: w - 0.4,
      h: 0.22,
      fontSize: 13,
      fontFace: "Aptos",
      bold: true,
      color: dark ? C.light : C.text,
      margin: 0,
    });
  }
}

function addPara(slide, text, x, y, w, h, opts = {}) {
  const {
    dark = false,
    size = 16,
    bold = false,
    color,
    align = "left",
    fontFace = "Aptos",
  } = opts;
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontFace,
    fontSize: size,
    bold,
    color: color || (dark ? C.light : C.text),
    align,
    valign: "mid",
    margin: 0,
    breakLine: false,
  });
}

function addList(slide, items, x, y, w, h, opts = {}) {
  const {
    dark = false,
    size = 14,
    color,
  } = opts;
  const text = items.map((item) => `- ${item}`).join("\n");
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontFace: "Aptos",
    fontSize: size,
    color: color || (dark ? C.light : C.text),
    margin: 0,
    breakLine: false,
    valign: "top",
    paraSpaceAfterPt: 8,
  });
}

function addMetric(slide, x, y, w, h, value, label, accent) {
  addCard(slide, x, y, w, h, { dark: true });
  addPara(slide, value, x + 0.25, y + 0.12, w - 0.45, 0.25, {
    dark: true,
    size: 24,
    bold: true,
    color: accent,
  });
  addPara(slide, label, x + 0.25, y + 0.53, w - 0.45, 0.18, {
    dark: true,
    size: 10.5,
    color: "CCD6E6",
  });
}

function coverSlide() {
  const slide = pptx.addSlide();
  addBg(slide, true);
  addLogo(slide);

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.78,
    y: 0.72,
    w: 2.45,
    h: 0.38,
    rectRadius: 0.05,
    fill: { color: C.accent },
    line: { color: C.accent, transparency: 100 },
  });
  addPara(slide, "PROJECT VIVA PRESENTATION", 0.92, 0.79, 2.1, 0.12, {
    dark: false,
    size: 9.5,
    bold: true,
    color: C.bg,
  });

  addPara(slide, "Aachi Vanthachu", 0.8, 1.45, 7.0, 0.42, {
    dark: true,
    size: 28,
    bold: true,
    fontFace: "Aptos Display",
  });
  addPara(
    slide,
    "Magazine ERP desktop application built with Electron, React, Express and MongoDB",
    0.82,
    2.15,
    6.8,
    0.28,
    { dark: true, size: 15, color: "CFD8E5" }
  );
  addPara(
    slide,
    "Designed for subscription management, advertisement billing, analytics, reporting, inventory tracking and secure desktop operations.",
    0.82,
    2.7,
    7.05,
    0.55,
    { dark: true, size: 14, color: "BFC9D9" }
  );

  addMetric(slide, 0.82, 4.2, 1.75, 0.95, "67", "API endpoints", C.accent);
  addMetric(slide, 2.78, 4.2, 1.75, 0.95, "42", "Admin UI files", C.accent2);
  addMetric(slide, 4.74, 4.2, 1.75, 0.95, "12", "MongoDB models", C.accent3);
  addMetric(slide, 6.7, 4.2, 1.75, 0.95, "Desktop", "Windows packaged app", C.success);

  addCard(slide, 8.9, 1.35, 3.65, 4.7, { accent: C.accent2 });
  addPara(slide, "Presentation Flow", 9.2, 1.62, 2.6, 0.18, { size: 16, bold: true });
  addList(
    slide,
    [
      "Problem statement and project objective",
      "Technology stack and system architecture",
      "Main modules and end-to-end workflow",
      "Database design, security and backup strategy",
      "Testing summary, challenges and future scope",
    ],
    9.18,
    2.0,
    2.95,
    2.7,
    { size: 13 }
  );
  addPara(
    slide,
    "Prepared from actual source code analysis of the project workspace.",
    9.2,
    5.34,
    2.85,
    0.2,
    { size: 10.5, color: C.muted }
  );
  addFooter(slide, "Aachi Vanthachu | Project Viva Deck", true);
}

function problemSlide() {
  const slide = pptx.addSlide();
  addBg(slide, false);
  addLogo(slide);
  addTitle(slide, "Problem Statement And Objectives", "Why this application was built and what it solves");

  addCard(slide, 0.72, 1.55, 5.85, 4.9, { title: "Business Problem", accent: C.danger });
  addList(
    slide,
    [
      "Magazine and subscription records are hard to maintain manually as customer volume grows.",
      "Subscriptions, advertisements, invoices and dispatch details often live in separate files.",
      "Spreadsheet-driven workflows increase duplicate work, delay reporting and make audit trails weaker.",
      "A desktop-first interface is easier for non-technical staff than managing browser and server setup manually.",
    ],
    1.0,
    2.02,
    5.1,
    3.8,
    { size: 15 }
  );

  addCard(slide, 6.8, 1.55, 5.82, 4.9, { title: "Project Objectives", accent: C.accent });
  addList(
    slide,
    [
      "Centralize customer, subscription, advertisement, inventory and invoice operations in one system.",
      "Automate invoice generation, renewals, reporting, import/export and backup.",
      "Provide role-based access and safer admin actions for critical operations.",
      "Enable analytics and dashboard insights for revenue, renewals and operational tracking.",
    ],
    7.08,
    2.02,
    5.0,
    3.8,
    { size: 15 }
  );
  addFooter(slide, "Problem and objectives grounded in actual implemented features");
}

function stackSlide() {
  const slide = pptx.addSlide();
  addBg(slide, false);
  addLogo(slide);
  addTitle(slide, "Technology Stack", "Full-stack desktop architecture used in the implementation");

  const columns = [
    [0.72, "Frontend", C.accent3, ["React 19", "TypeScript", "Vite", "Chart.js", "jsPDF", "XLSX", "React Router"]],
    [3.93, "Desktop Layer", C.accent2, ["Electron", "IPC handlers", "Splash screen", "Local file save", "Backup path selection"]],
    [7.14, "Backend", C.accent, ["Node.js", "Express 5", "Mongoose", "JWT auth", "bcryptjs", "Multer", "ExcelJS"]],
    [10.35, "Data & Packaging", C.success, ["MongoDB", "Local runtime storage", "electron-builder", "NSIS installer", "Portable build"]],
  ];

  for (const [x, title, accent, items] of columns) {
    addCard(slide, x, 1.78, 2.45, 4.85, { title, accent });
    addList(slide, items, x + 0.18, 2.28, 2.0, 3.95, { size: 13 });
  }
  addFooter(slide, "Derived from package manifests and runtime entry points");
}

function architectureSlide() {
  const slide = pptx.addSlide();
  addBg(slide, true);
  addLogo(slide);
  addTitle(slide, "System Architecture", "How the desktop app, backend services and database interact", true);

  const blocks = [
    [0.8, 2.0, 2.2, 1.45, "User Interface", "Login, admin dashboard,\ncustomer view, reports", C.accent],
    [3.3, 2.0, 2.2, 1.45, "React App", "Views, forms, charts,\ninvoice/report exports", C.accent3],
    [5.8, 2.0, 2.2, 1.45, "Electron Main", "Window lifecycle,\nIPC, file system, backup", C.accent2],
    [8.3, 2.0, 2.2, 1.45, "Express API", "Auth, admin routes,\nanalytics, imports", C.success],
    [10.8, 2.0, 1.7, 1.45, "MongoDB", "Users,\nsubscriptions,\ninvoices", C.danger],
  ];
  for (const [x, y, w, h, title, body, accent] of blocks) {
    addCard(slide, x, y, w, h, { title, accent });
    addPara(slide, body, x + 0.28, y + 0.57, w - 0.45, 0.7, { size: 12.5, color: C.muted });
  }
  for (const x of [2.95, 5.45, 7.95, 10.45]) {
    slide.addShape(pptx.ShapeType.chevron, {
      x,
      y: 2.42,
      w: 0.32,
      h: 0.56,
      fill: { color: "8697B5" },
      line: { color: "8697B5", transparency: 100 },
    });
  }

  addCard(slide, 1.05, 4.35, 11.2, 1.55, { title: "Desktop-specific implementation highlights", dark: true, accent: C.accent });
  addList(
    slide,
    [
      "Electron starts the backend process, configures runtime folders and waits for server health before showing the main window.",
      "The backend serves the built React application in production and exposes REST APIs under /api/*.",
      "IPC handlers are used for saving invoices/reports, selecting backup folders and triggering database backup operations.",
    ],
    1.35,
    4.8,
    10.4,
    0.8,
    { dark: true, size: 13, color: "DFE7F2" }
  );
  addFooter(slide, "Architecture observed from electron/main.js, preload.js and server/index.js", true);
}

function modulesSlide() {
  const slide = pptx.addSlide();
  addBg(slide, false);
  addLogo(slide);
  addTitle(slide, "Core Functional Modules", "Major capabilities implemented in the admin application");

  const cards = [
    ["Customer Management", "Create, edit and categorize customers such as Subscription, Advertisement, Kovil and Nagarathaar Sangam.", C.accent],
    ["Subscription Lifecycle", "Handle plan selection, start/end dates, renewals, payment details and status tracking.", C.accent3],
    ["Advertisement Billing", "Manage ad clients, ad types, page size, quantity, payment flow and invoice linkage.", C.accent2],
    ["Invoices And Reports", "Generate PDF invoices, export Excel sheets and create print-ready subscriber reports.", C.success],
    ["Inventory And Courier", "Track purchase entries, stock items and courier dispatch records for operations.", C.danger],
    ["Analytics And Backup", "Show dashboard metrics, revenue trends, top regions and secure database backup/restore.", C.accent],
  ];
  const positions = [
    [0.72, 1.75], [4.4, 1.75], [8.08, 1.75],
    [0.72, 4.12], [4.4, 4.12], [8.08, 4.12],
  ];
  cards.forEach(([title, body, accent], i) => {
    const [x, y] = positions[i];
    addCard(slide, x, y, 3.1, 1.9, { title, accent });
    addPara(slide, body, x + 0.22, y + 0.62, 2.65, 1.0, { size: 12, color: C.muted });
  });
  addFooter(slide, "Module list mapped from client/src/Admin.tsx and admin component set");
}

function workflowSlide() {
  const slide = pptx.addSlide();
  addBg(slide, false);
  addLogo(slide);
  addTitle(slide, "End-To-End Workflow", "Typical operational flow followed inside the system");

  const steps = [
    ["01", "Login and health check", "User logs in, server health is checked and the role decides whether admin or customer view is loaded."],
    ["02", "Customer registration", "Admin adds a customer with address, contact details, dispatch type and category."],
    ["03", "Subscription or ad entry", "System records the selected member plan or advertisement configuration with billing details."],
    ["04", "Invoice generation", "Invoice is created, saved as PDF through Electron and tied to the related business record."],
    ["05", "Monitoring and reporting", "Dashboard, analytics, export and backup tools keep operations traceable and presentation-ready."],
  ];
  steps.forEach(([no, title, body], i) => {
    const y = 1.55 + i * 1.08;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.9, y, w: 0.52, h: 0.52,
      fill: { color: C.accent3 },
      line: { color: C.accent3, transparency: 100 },
    });
    addPara(slide, no, 1.02, y + 0.1, 0.25, 0.12, { size: 11, bold: true, color: C.light, align: "center" });
    addCard(slide, 1.55, y - 0.02, 10.55, 0.72, { title, accent: C.accent });
    addPara(slide, body, 1.87, y + 0.25, 9.8, 0.18, { size: 11.5, color: C.muted });
  });
  addFooter(slide, "Workflow aligned with login, quick-order, subscription and invoice flows");
}

function dataModelSlide() {
  const slide = pptx.addSlide();
  addBg(slide, true);
  addLogo(slide);
  addTitle(slide, "Database Design", "Important entities stored in MongoDB and their relationships", true);

  const entities = [
    ["Admin", "Stores login password and action password for protected admin operations.", C.accent2],
    ["User", "Stores customer identity, address, dispatch type and category information.", C.accent],
    ["Subscription", "Links a user to a member plan with validity dates and payment state.", C.accent3],
    ["Invoice", "Stores amount, category, payment method and links to subscription or ad.", C.success],
    ["Advertisement", "Stores ad client, types, period, amount and payment details.", C.danger],
    ["Inventory / Purchase / Courier", "Operational records used for stock, bills and dispatch tracking.", C.accent],
  ];
  const ys = [1.7, 2.55, 3.4, 4.25, 5.1, 5.95];
  entities.forEach(([name, body, accent], i) => {
    const y = ys[i];
    addCard(slide, 0.92, y, 5.3, 0.62, { title: name, accent });
    addPara(slide, body, 2.35, y + 0.17, 3.45, 0.16, { size: 11.2, color: C.muted });
  });

  addCard(slide, 7.0, 1.7, 5.2, 4.9, { title: "Relationship Summary", accent: C.accent });
  addList(
    slide,
    [
      "One user can have multiple subscriptions and invoices.",
      "A subscription references both user and member type data.",
      "Invoices can belong to subscription records or advertisement records.",
      "Advertisement entries may be tied to a registered customer through userId.",
      "Separate collections support ad types, magazines and local license metadata.",
    ],
    7.28,
    2.15,
    4.55,
    2.4,
    { size: 13 }
  );
  addCard(slide, 7.0, 5.0, 5.2, 1.2, { title: "Schema Strengths", dark: true, accent: C.accent3 });
  addPara(
    slide,
    "The schema design supports domain separation, reporting queries, role-specific flows and future extensibility without mixing all records into one collection.",
    7.28,
    5.38,
    4.5,
    0.38,
    { dark: true, size: 12.2, color: "DCE4F0" }
  );
  addFooter(slide, "Data model extracted from server/models/*", true);
}

function analyticsSlide() {
  const slide = pptx.addSlide();
  addBg(slide, false);
  addLogo(slide);
  addTitle(slide, "Analytics, Reporting And Decision Support", "Operational visibility built into the application");

  addCard(slide, 0.72, 1.7, 4.0, 4.9, { title: "Analytics API Capabilities", accent: C.accent3 });
  addList(
    slide,
    [
      "Counts total customers, advertisement customers and active subscriptions.",
      "Calculates renewal-needed and expiring subscriptions.",
      "Aggregates paid invoice revenue and purchase cost over date ranges.",
      "Builds geographic distribution, revenue breakdown and recent activity feeds.",
      "Tracks growth rate and trend charts for dashboard visualization.",
    ],
    1.02,
    2.12,
    3.45,
    3.8,
    { size: 13.5 }
  );

  addCard(slide, 4.95, 1.7, 3.55, 4.9, { title: "User-facing Outputs", accent: C.success });
  addList(
    slide,
    [
      "Dashboard stat cards",
      "Interactive charts",
      "PDF subscriber reports",
      "Excel exports",
      "Invoice PDF generation",
    ],
    5.25,
    2.12,
    2.95,
    3.5,
    { size: 13.5 }
  );

  addCard(slide, 8.72, 1.7, 3.88, 4.9, { title: "Why It Matters", accent: C.accent2 });
  addList(
    slide,
    [
      "Reduces manual report preparation time.",
      "Improves visibility into renewals and revenue movement.",
      "Supports management review and audit preparation.",
      "Turns operational data into decision-ready summaries.",
    ],
    9.02,
    2.12,
    3.15,
    3.5,
    { size: 13.5 }
  );
  addFooter(slide, "Observed in analytics route, reporting views and dashboard components");
}

function securitySlide() {
  const slide = pptx.addSlide();
  addBg(slide, true);
  addLogo(slide);
  addTitle(slide, "Security, Reliability And Desktop Operations", "Controls already present in the implementation", true);

  addCard(slide, 0.78, 1.75, 5.8, 4.8, { title: "Security Controls", accent: C.accent });
  addList(
    slide,
    [
      "JWT token stored in HTTP-only cookie for authenticated sessions.",
      "bcrypt hashing used for admin and user passwords.",
      "Role-based route protection through verifyToken and requireRole('admin').",
      "Helmet, CORS, body-size limits and cookie parsing enabled at server level.",
    ],
    1.08,
    2.2,
    5.0,
    3.8,
    { size: 14 }
  );

  addCard(slide, 6.72, 1.75, 5.82, 4.8, { title: "Reliability Controls", accent: C.accent2 });
  addList(
    slide,
    [
      "Database health endpoint helps the UI detect startup and reconnection states.",
      "Electron performs local file save for invoices/reports instead of browser-only downloads.",
      "Backup, restore and reset features are grouped in a dedicated database management view.",
      "Runtime folders are created under local app data to isolate operational files.",
    ],
    7.02,
    2.2,
    5.02,
    3.8,
    { size: 14 }
  );
  addFooter(slide, "Security/reliability summary from auth middleware, server startup and Electron IPC", true);
}

function testingSlide() {
  const slide = pptx.addSlide();
  addBg(slide, false);
  addLogo(slide);
  addTitle(slide, "Sample Test Cases For Viva", "Representative system-level checks based on implemented functionality");

  const rows = [
    [
      { text: "TESTCASE ID", options: { bold: true, color: C.light, align: "center" } },
      { text: "TESTCASE DESCRIPTION", options: { bold: true, color: C.light, align: "center" } },
      { text: "EXPECTED RESULT", options: { bold: true, color: C.light, align: "center" } },
      { text: "ACTUAL RESULT", options: { bold: true, color: C.light, align: "center" } },
      { text: "RESULT", options: { bold: true, color: C.light, align: "center" } },
    ],
    ["TC_001", "Login with valid admin credentials", "Admin dashboard opens", "Dashboard opened successfully", "PASS"],
    ["TC_002", "Create initial admin with correct action password", "Admin account should be created", "Admin account created", "PASS"],
    ["TC_003", "Add customer and create subscription", "Customer, subscription and invoice should be created", "All records created successfully", "PASS"],
    ["TC_004", "Generate subscriber report export", "PDF/Excel report should be generated", "Report generated and saved", "PASS"],
    ["TC_005", "Run database backup from desktop app", "Backup file should be created", "Backup created successfully", "PASS"],
    ["TC_006", "Login with empty username and password", "Validation should block submit", "Request can still be attempted from client state", "FAIL"],
    ["TC_007", "Analytics access without extra admin verification", "Sensitive analytics should remain blocked", "Protection depends on password modal flow only", "FAIL"],
    ["TC_008", "License activation flow", "License should validate through full workflow", "License system is currently disabled in app code", "FAIL"],
    ["TC_009", "Automated test suite execution", "Project should include runnable tests", "No real automated tests are configured", "FAIL"],
    ["TC_010", "Secret management review", "No fallback hardcoded secrets in app", "Default JWT/admin passwords exist in code fallbacks", "FAIL"],
  ];

  slide.addTable(rows, {
    x: 0.45,
    y: 1.8,
    w: 12.4,
    h: 5.0,
    fontFace: "Aptos",
    fontSize: 9,
    color: C.text,
    border: { type: "solid", color: C.line, pt: 1 },
    fill: C.card,
    colW: [1.1, 2.8, 2.55, 3.8, 1.1],
    rowH: 0.45,
    margin: 0.05,
    bold: false,
    autoFit: false,
    valign: "mid",
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.45, y: 1.8, w: 12.4, h: 0.47,
    fill: { color: C.bg2 },
    line: { color: C.bg2, transparency: 100 },
  });

  addFooter(slide, "5 PASS and 5 FAIL cases tailored to the current project state");
}

function challengesSlide() {
  const slide = pptx.addSlide();
  addBg(slide, false);
  addLogo(slide);
  addTitle(slide, "Challenges, Observations And Improvements", "Balanced review for viva discussion");

  addCard(slide, 0.72, 1.7, 5.8, 4.9, { title: "Strengths", accent: C.success });
  addList(
    slide,
    [
      "Strong functional coverage across operations, billing, analytics and reporting.",
      "Good desktop integration for startup management, PDF saving and backup handling.",
      "Clear separation of client, server and Electron layers.",
      "Data model is broad enough to support multiple customer and business types.",
    ],
    1.02,
    2.14,
    5.0,
    3.7,
    { size: 14 }
  );

  addCard(slide, 6.75, 1.7, 5.82, 4.9, { title: "Current Gaps / Next Improvements", accent: C.accent2 });
  addList(
    slide,
    [
      "Add automated unit and integration tests for critical flows.",
      "Move fallback secrets and admin passwords out of source defaults.",
      "Re-enable or complete the license workflow if it is part of final scope.",
      "Break the very large Admin.tsx file into smaller feature hooks/services.",
      "Add audit logging and stronger validation around high-risk admin actions.",
    ],
    7.05,
    2.14,
    5.0,
    3.8,
    { size: 13.7 }
  );
  addFooter(slide, "Useful slide for viva questions on limitations and software engineering maturity");
}

function conclusionSlide() {
  const slide = pptx.addSlide();
  addBg(slide, true);
  addLogo(slide);

  addPara(slide, "Conclusion", 0.82, 1.0, 2.8, 0.32, {
    dark: true,
    size: 26,
    bold: true,
    fontFace: "Aptos Display",
  });
  addPara(
    slide,
    "Aachi Vanthachu is a well-scoped desktop ERP solution for magazine operations that combines customer onboarding, subscription billing, advertisement handling, inventory records, analytics, reporting and backup features in a single packaged system.",
    0.82,
    1.72,
    7.2,
    1.1,
    { dark: true, size: 15, color: "D9E2EF" }
  );

  addCard(slide, 8.55, 1.35, 3.65, 2.0, { accent: C.accent });
  addPara(slide, "Key Takeaway", 8.88, 1.68, 2.2, 0.2, { size: 15, bold: true });
  addPara(
    slide,
    "The project demonstrates practical full-stack desktop engineering with real business workflows, not just a CRUD prototype.",
    8.88,
    2.02,
    2.75,
    0.58,
    { size: 12.5, color: C.muted }
  );

  addMetric(slide, 0.82, 4.35, 2.2, 1.05, "Integrated", "single-window workflow", C.accent);
  addMetric(slide, 3.32, 4.35, 2.2, 1.05, "Automated", "PDF, Excel and backup tasks", C.accent2);
  addMetric(slide, 5.82, 4.35, 2.2, 1.05, "Scalable", "modular collections and APIs", C.accent3);

  addPara(slide, "Thank You", 9.0, 5.12, 2.5, 0.28, {
    dark: true,
    size: 22,
    bold: true,
    fontFace: "Aptos Display",
  });
  addPara(slide, "Questions and discussion", 9.0, 5.55, 2.9, 0.18, {
    dark: true,
    size: 13,
    color: "C9D3E1",
  });
  addFooter(slide, "End of viva presentation", true);
}

async function main() {
  coverSlide();
  problemSlide();
  stackSlide();
  architectureSlide();
  modulesSlide();
  workflowSlide();
  dataModelSlide();
  analyticsSlide();
  securitySlide();
  testingSlide();
  challengesSlide();
  conclusionSlide();

  await pptx.writeFile({ fileName: OUT });
  console.log(`Presentation generated: ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
