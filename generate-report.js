const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const outputPath = path.join(
  __dirname,
  "DealFlow360_Project_Report.pdf"
);

const doc = new PDFDocument({
  size: "A4",
  margins: {
    top: 55,
    bottom: 55,
    left: 55,
    right: 55,
  },
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// -----------------------------
// Helpers
// -----------------------------

function addPageNumber() {
  const pageNumber = doc.bufferedPageRange().count;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#666666")
    .text(
      `DealFlow360 | Page ${pageNumber}`,
      55,
      805,
      {
        width: 485,
        align: "center",
      }
    );

  doc.fillColor("#111111");
}

function ensureSpace(height = 80) {
  if (doc.y + height > 750) {
    doc.addPage();
  }
}

function title(text) {
  ensureSpace(100);

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#17324D")
    .text(text, {
      align: "left",
      spacingAfter: 10,
    });

  doc
    .moveTo(55, doc.y)
    .lineTo(540, doc.y)
    .strokeColor("#B8C7D9")
    .stroke();

  doc.moveDown(0.7);
  doc.fillColor("#111111");
}

function heading(text) {
  ensureSpace(80);

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#245B8A")
    .text(text);

  doc.moveDown(0.35);
  doc.fillColor("#111111");
}

function subheading(text) {
  ensureSpace(50);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#333333")
    .text(text);

  doc.moveDown(0.25);
  doc.fillColor("#111111");
}

function paragraph(text) {
  ensureSpace(70);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#222222")
    .text(text, {
      align: "justify",
      lineGap: 4,
    });

  doc.moveDown(0.6);
}

function bullet(text) {
  ensureSpace(40);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#222222")
    .text(`• ${text}`, {
      indent: 12,
      lineGap: 3,
    });

  doc.moveDown(0.25);
}

function numbered(number, text) {
  ensureSpace(40);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#222222")
    .text(`${number}. ${text}`, {
      indent: 8,
      lineGap: 3,
    });

  doc.moveDown(0.25);
}

function table(headers, rows, widths) {
  ensureSpace(100);

  const startX = 55;
  let y = doc.y;

  const rowHeight = 30;

  // Header
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#17324D");

  let x = startX;

  headers.forEach((header, index) => {
    doc
      .rect(x, y, widths[index], rowHeight)
      .strokeColor("#AAB8C5")
      .stroke();

    doc.text(header, x + 5, y + 9, {
      width: widths[index] - 10,
      align: "left",
    });

    x += widths[index];
  });

  y += rowHeight;

  // Rows
  rows.forEach((row) => {
    if (y > 730) {
      doc.addPage();
      y = 55;

      x = startX;

      doc.font("Helvetica-Bold").fontSize(9);

      headers.forEach((header, index) => {
        doc
          .rect(x, y, widths[index], rowHeight)
          .strokeColor("#AAB8C5")
          .stroke();

        doc.text(header, x + 5, y + 9, {
          width: widths[index] - 10,
        });

        x += widths[index];
      });

      y += rowHeight;
    }

    x = startX;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#222222");

    row.forEach((cell, index) => {
      doc
        .rect(x, y, widths[index], rowHeight)
        .strokeColor("#C7D0D9")
        .stroke();

      doc.text(String(cell), x + 5, y + 7, {
        width: widths[index] - 10,
        height: rowHeight - 10,
      });

      x += widths[index];
    });

    y += rowHeight;
  });

  doc.y = y + 15;
}

// -----------------------------
// Cover Page
// -----------------------------

doc
  .font("Helvetica-Bold")
  .fontSize(32)
  .fillColor("#17324D")
  .text("DealFlow360", 55, 220, {
    align: "center",
    width: 485,
  });

doc
  .font("Helvetica")
  .fontSize(17)
  .fillColor("#245B8A")
  .text(
    "Intelligent Deal Management & Sales Operations Platform",
    75,
    275,
    {
      align: "center",
      width: 445,
    }
  );

doc.moveDown(2);

doc
  .font("Helvetica")
  .fontSize(12)
  .fillColor("#444444")
  .text(
    "Project Report",
    {
      align: "center",
    }
  );

doc.moveDown(1);

doc
  .font("Helvetica")
  .fontSize(11)
  .fillColor("#666666")
  .text(
    "A modern SaaS platform for managing customers,\ndeals, approvals, inventory, fulfillment and billing.",
    {
      align: "center",
    }
  );

doc.moveDown(5);

doc
  .font("Helvetica")
  .fontSize(10)
  .fillColor("#555555")
  .text(
    "Technology: React + Vite | Node.js + Express | MySQL",
    {
      align: "center",
    }
  );

doc.text(
  "Prepared for academic / hackathon project presentation",
  {
    align: "center",
  }
);

doc.addPage();

// -----------------------------
// Table of Contents
// -----------------------------

title("Table of Contents");

const contents = [
  "1. Abstract",
  "2. Introduction",
  "3. Problem Statement",
  "4. Proposed Solution",
  "5. Objectives",
  "6. Key Features",
  "7. Functional Requirements",
  "8. Non-Functional Requirements",
  "9. Technology Stack",
  "10. System Architecture",
  "11. Database Design",
  "12. Application Modules",
  "13. Authentication & Security",
  "14. Deal Management Workflow",
  "15. Approval Workflow",
  "16. Fulfillment & Inventory",
  "17. Billing & Customer Portal",
  "18. Frontend Design",
  "19. Backend API",
  "20. Testing",
  "21. Results",
  "22. Advantages",
  "23. Limitations",
  "24. Future Scope",
  "25. Conclusion",
];

contents.forEach((item) => bullet(item));

doc.addPage();

// -----------------------------
// 1. Abstract
// -----------------------------

title("1. Abstract");

paragraph(
  "DealFlow360 is a full-stack intelligent deal management and sales operations platform designed to simplify the complete lifecycle of a business deal. The platform brings together customer management, deal creation, product selection, pricing, margin calculation, approval workflows, warehouse allocation, fulfillment tracking, billing and customer-facing information in one centralized system."
);

paragraph(
  "The system is designed using a modern web architecture consisting of a React and Vite frontend, a Node.js and Express backend, and a MySQL relational database. The platform provides a clean SaaS-style interface while maintaining a structured backend capable of handling authentication, business operations and persistent data."
);

paragraph(
  "The main objective of DealFlow360 is to reduce operational complexity and provide sales teams with a single source of truth for managing deals. By connecting sales, finance, inventory, fulfillment and customer information, the platform can improve visibility, reduce manual work and support faster decision-making."
);

// -----------------------------
// 2. Introduction
// -----------------------------

title("2. Introduction");

paragraph(
  "Modern businesses often use multiple disconnected systems for customer information, quotations, sales deals, inventory, approvals, fulfillment and billing. This fragmentation can lead to duplicate data, delayed approvals, communication gaps and limited visibility into the current status of a deal."
);

paragraph(
  "DealFlow360 addresses this challenge by providing an integrated platform where the important stages of a deal can be represented within a single application. Users can authenticate into the system, access their workspace, manage customers, create and review deals, monitor approvals and interact with operational modules."
);

paragraph(
  "The application follows a modular architecture so that individual business capabilities can be developed and extended independently while sharing a common database and authentication mechanism."
);

// -----------------------------
// 3. Problem Statement
// -----------------------------

title("3. Problem Statement");

paragraph(
  "Sales and operations teams need accurate and timely information to convert opportunities into successful business transactions. When deal information is maintained across spreadsheets, emails and separate applications, teams may struggle to understand the actual status of a transaction."
);

bullet("Customer information may be distributed across different systems.");
bullet("Deal pricing and margin calculations may require manual effort.");
bullet("Approval processes can become difficult to track.");
bullet("Inventory and warehouse information may not be connected to deals.");
bullet("Fulfillment teams may lack real-time deal context.");
bullet("Billing information may be separated from the sales workflow.");
bullet("Managers may not have a centralized view of operational performance.");

paragraph(
  "Therefore, there is a need for a centralized deal management platform that connects the major stages of the sales and operational lifecycle."
);

// -----------------------------
// 4. Proposed Solution
// -----------------------------

title("4. Proposed Solution");

paragraph(
  "DealFlow360 provides a centralized SaaS-style workspace for managing business deals from creation through approval, fulfillment and billing. The system combines customer records, products, deal items, pricing calculations, approval requests, warehouse allocations and operational events."
);

paragraph(
  "The frontend provides an interactive workspace for users, while the Express backend exposes REST APIs for authentication and business operations. MySQL provides structured persistence for the application's entities and relationships."
);

subheading("Core Solution Approach");

bullet("Centralize customer and deal information.");
bullet("Automate deal totals, discounts and margin calculations.");
bullet("Provide structured approval management.");
bullet("Connect deals with inventory and warehouses.");
bullet("Track operational events and fulfillment.");
bullet("Provide billing and customer-facing views.");
bullet("Provide role-aware authentication and account information.");
bullet("Use a scalable modular architecture for future AI capabilities.");

// -----------------------------
// 5. Objectives
// -----------------------------

title("5. Objectives");

numbered(1, "Develop a centralized platform for end-to-end deal management.");
numbered(2, "Reduce manual effort in sales and operational processes.");
numbered(3, "Improve visibility into deal status and business operations.");
numbered(4, "Provide secure user authentication.");
numbered(5, "Maintain customer, product and inventory information in a relational database.");
numbered(6, "Support approval workflows for business decisions.");
numbered(7, "Connect deal information with fulfillment and billing operations.");
numbered(8, "Create a modern and user-friendly SaaS interface.");
numbered(9, "Build an architecture that can support intelligent automation in future versions.");

// -----------------------------
// 6. Key Features
// -----------------------------

title("6. Key Features");

table(
  ["Feature", "Description"],
  [
    ["Authentication", "Secure login and session handling."],
    ["Dashboard", "Central workspace for operational visibility."],
    ["Customers", "Manage customer information and relationships."],
    ["Deals", "Create, view and manage business deals."],
    ["Deal Builder", "Configure products, quantities, discounts and pricing."],
    ["Approvals", "Review and manage approval requests."],
    ["Fulfillment", "Track operational fulfillment information."],
    ["Billing", "Manage billing-related deal information."],
    ["Customer Portal", "Provide customer-facing deal information."],
    ["Settings", "Manage account information and logout."],
  ],
  [125, 360]
);

// -----------------------------
// 7. Functional Requirements
// -----------------------------

title("7. Functional Requirements");

subheading("User Authentication");

bullet("Users should be able to log in using valid credentials.");
bullet("The backend should validate authentication requests.");
bullet("Authenticated users should receive a session token.");
bullet("The frontend should maintain authentication state.");
bullet("Users should be able to log out.");

subheading("Customer Management");

bullet("Users should be able to view customer information.");
bullet("Customer records should be stored in the database.");
bullet("Customer information should be associated with deals.");

subheading("Deal Management");

bullet("Users should be able to create a deal.");
bullet("A deal should be associated with a customer.");
bullet("A deal may contain multiple deal items.");
bullet("Products and quantities should be selectable.");
bullet("Discounts should be supported.");
bullet("Deal totals and margins should be calculated.");
bullet("Existing deals should be viewable and updateable.");

subheading("Operations");

bullet("Approval requests should be represented as database records.");
bullet("Warehouse and inventory information should be available to operational workflows.");
bullet("Deal events should support operational tracking.");
bullet("Billing and customer portal views should provide appropriate information.");

// -----------------------------
// 8. Non-Functional Requirements
// -----------------------------

title("8. Non-Functional Requirements");

table(
  ["Requirement", "Implementation Goal"],
  [
    ["Performance", "Fast client-side navigation and efficient API requests."],
    ["Security", "Authentication and protected backend operations."],
    ["Scalability", "Modular frontend and REST-based backend."],
    ["Usability", "Simple and modern SaaS-style interface."],
    ["Maintainability", "Separated pages, layouts, routes and services."],
    ["Reliability", "Structured relational database and validation."],
    ["Responsiveness", "Interface designed for common desktop and web layouts."],
  ],
  [135, 350]
);

// -----------------------------
// 9. Technology Stack
// -----------------------------

title("9. Technology Stack");

table(
  ["Layer", "Technology"],
  [
    ["Frontend", "React + TypeScript"],
    ["Build Tool", "Vite"],
    ["Styling", "CSS"],
    ["Icons", "Lucide React"],
    ["Backend", "Node.js + Express"],
    ["Database", "MySQL 8"],
    ["Database Driver", "mysql2"],
    ["Authentication", "JWT-based authentication"],
    ["Configuration", "dotenv"],
    ["API Format", "REST / JSON"],
    ["Version Control", "Git + GitHub"],
  ],
  [145, 340]
);

// -----------------------------
// 10. System Architecture
// -----------------------------

title("10. System Architecture");

paragraph(
  "DealFlow360 follows a three-layer full-stack web architecture. The presentation layer is implemented using React and Vite. The application layer is implemented using Node.js and Express, exposing REST APIs. The persistence layer is implemented using MySQL."
);

subheading("Architecture Flow");

bullet("User interacts with the React frontend.");
bullet("Frontend sends HTTP requests to the Express backend.");
bullet("Express routes validate and process business operations.");
bullet("Backend communicates with the MySQL database.");
bullet("Database returns structured data to the backend.");
bullet("Backend returns JSON responses to the frontend.");
bullet("Frontend updates the interface based on the response.");

subheading("High-Level Architecture");

paragraph(
  "Browser / React Frontend → Express REST API → Business Logic → MySQL Database"
);

// -----------------------------
// 11. Database Design
// -----------------------------

title("11. Database Design");

paragraph(
  "The DealFlow360 database uses a relational model. Business entities are separated into normalized tables so that customers, products, deals, inventory, approvals and operational events can be managed independently while maintaining relationships between them."
);

table(
  ["Table", "Purpose"],
  [
    ["users", "Stores application user accounts and roles."],
    ["customers", "Stores customer information."],
    ["products", "Stores product information."],
    ["warehouses", "Stores warehouse information."],
    ["inventory", "Connects products with warehouse inventory."],
    ["deals", "Stores primary deal records."],
    ["deal_items", "Stores products included in deals."],
    ["approval_requests", "Stores approval workflow requests."],
    ["deal_events", "Stores deal-related operational events."],
    ["warehouse_allocations", "Stores warehouse allocation information."],
  ],
  [165, 320]
);

subheading("Important Relationships");

bullet("A customer can be associated with multiple deals.");
bullet("A deal can contain multiple deal items.");
bullet("A deal item references a product.");
bullet("Inventory connects products with warehouses.");
bullet("Approval requests can be associated with deals.");
bullet("Deal events provide an operational history.");
bullet("Warehouse allocations connect deals with fulfillment resources.");

// -----------------------------
// 12. Application Modules
// -----------------------------

title("12. Application Modules");

subheading("Dashboard");

paragraph(
  "The Dashboard provides the main workspace for users after authentication. It is intended to provide an overview of the application's major operational areas."
);

subheading("Customers");

paragraph(
  "The Customers module provides access to customer-related information and supports the relationship between customers and business deals."
);

subheading("Deals");

paragraph(
  "The Deals module displays existing deals and allows users to inspect and manage deal records."
);

subheading("Deal Builder");

paragraph(
  "The Deal Builder provides a structured interface for creating deals. Users can select customers, add products, specify quantities and apply discounts. The backend calculates important financial values."
);

subheading("Approvals");

paragraph(
  "The Approvals module represents the business approval stage. Approval requests can be reviewed and tracked separately from the main deal creation workflow."
);

subheading("Fulfillment");

paragraph(
  "The Fulfillment module connects the sales process with operational execution. Warehouse and allocation information can be used to support fulfillment activities."
);

subheading("Billing");

paragraph(
  "The Billing module provides a dedicated operational area for billing-related deal information."
);

subheading("Customer Portal");

paragraph(
  "The Customer Portal is designed to provide a customer-oriented view of relevant deal information without exposing the internal workspace."
);

subheading("Settings");

paragraph(
  "The Settings module provides account information including the authenticated user's name, email and role, along with a logout action."
);

// -----------------------------
// 13. Authentication & Security
// -----------------------------

title("13. Authentication & Security");

paragraph(
  "Authentication is implemented using a backend login API. The frontend sends the user's credentials to the authentication endpoint. After successful validation, the backend provides a token and user information."
);

paragraph(
  "The frontend stores the authentication state locally and uses it to determine whether the login screen or main application workspace should be displayed."
);

subheading("Security Practices");

bullet("Credentials are processed by the backend authentication system.");
bullet("JWT is used for authenticated sessions.");
bullet("Sensitive configuration values are stored using environment variables.");
bullet("Database credentials should not be committed to source control.");
bullet("Protected backend operations require authentication.");
bullet("Logout clears the stored authentication state.");

// -----------------------------
// 14. Deal Management Workflow
// -----------------------------

title("14. Deal Management Workflow");

numbered(1, "User logs into DealFlow360.");
numbered(2, "User enters the main workspace.");
numbered(3, "User selects or creates a customer.");
numbered(4, "User opens the Deal Builder.");
numbered(5, "User selects products and quantities.");
numbered(6, "User applies a discount when required.");
numbered(7, "Backend calculates subtotal, cost, discount, total and margin.");
numbered(8, "Deal is stored in the database.");
numbered(9, "Deal can proceed through approval and operational workflows.");
numbered(10, "Fulfillment and billing modules can use the deal information.");

// -----------------------------
// 15. Approval Workflow
// -----------------------------

title("15. Approval Workflow");

paragraph(
  "Approval management provides a structured way to handle deals that require review before execution. Instead of relying only on informal communication, approval information can be represented as application records."
);

bullet("A deal may require approval based on business conditions.");
bullet("An approval request can be stored in the database.");
bullet("Authorized users can review approval information.");
bullet("Approval status can be used by downstream operational workflows.");
bullet("Approval history can be supported through deal events.");

// -----------------------------
// 16. Fulfillment & Inventory
// -----------------------------

title("16. Fulfillment & Inventory");

paragraph(
  "DealFlow360 connects sales information with operational inventory and warehouse information. This connection is important because a successful deal requires not only commercial approval but also the ability to fulfill the requested products."
);

bullet("Products are maintained independently from deals.");
bullet("Warehouse records represent physical fulfillment locations.");
bullet("Inventory connects products and warehouse availability.");
bullet("Warehouse allocations can associate fulfillment resources with deals.");
bullet("Operational events can provide traceability for deal execution.");

// -----------------------------
// 17. Billing & Customer Portal
// -----------------------------

title("17. Billing & Customer Portal");

subheading("Billing");

paragraph(
  "The Billing module provides a dedicated workspace for financial operations associated with deals. It creates a logical separation between sales configuration and downstream billing activities."
);

subheading("Customer Portal");

paragraph(
  "The Customer Portal provides a customer-oriented interface for displaying relevant deal information. The purpose is to reduce dependency on internal operational screens when customers need information about their transaction."
);

// -----------------------------
// 18. Frontend Design
// -----------------------------

title("18. Frontend Design");

paragraph(
  "The DealFlow360 frontend follows a modern SaaS dashboard approach. The interface is designed to be clean, bright, structured and suitable for a professional business application."
);

bullet("React component-based architecture.");
bullet("TypeScript for type safety.");
bullet("Vite for fast development and production builds.");
bullet("Central MainLayout for the authenticated workspace.");
bullet("State-based navigation between application modules.");
bullet("Reusable UI patterns across pages.");
bullet("Lucide React icons for interface elements.");
bullet("Responsive and visually consistent styling.");
bullet("Dedicated login and authenticated application experiences.");

// -----------------------------
// 19. Backend API
// -----------------------------

title("19. Backend API");

paragraph(
  "The backend is implemented using Node.js and Express. REST endpoints are grouped according to business functionality."
);

table(
  ["Route Group", "Purpose"],
  [
    ["/api/auth", "Authentication and login operations."],
    ["/api/deals", "Deal creation, retrieval and updates."],
    ["/api/customers", "Customer-related operations."],
    ["/api/products", "Product-related operations."],
    ["/api/warehouses", "Warehouse-related operations."],
    ["/api/approvals", "Approval workflow operations."],
  ],
  [150, 335]
);

subheading("Deal Calculation");

paragraph(
  "When a deal is created, the backend can calculate the subtotal, cost, discount, total amount and margin using the submitted deal items and pricing information. Performing these calculations on the server helps keep business logic centralized."
);

// -----------------------------
// 20. Testing
// -----------------------------

title("20. Testing");

paragraph(
  "Testing was performed during development to verify that the frontend and backend components could work together and that the application could be built successfully."
);

table(
  ["Test Area", "Expected Result"],
  [
    ["Frontend Build", "Application builds successfully using Vite."],
    ["Login", "Valid credentials allow access to workspace."],
    ["Invalid Login", "Invalid credentials are rejected."],
    ["Authentication State", "Authenticated state persists locally."],
    ["Logout", "Token and user state are cleared."],
    ["Deal API", "Deal data can be created and retrieved."],
    ["Database", "Application data is stored in MySQL."],
    ["Navigation", "Workspace modules can be opened."],
  ],
  [155, 330]
);

paragraph(
  "The frontend production build was also verified during development using the Vite build process, confirming that the TypeScript application could be compiled and bundled successfully."
);

// -----------------------------
// 21. Results
// -----------------------------

title("21. Results");

paragraph(
  "The implemented DealFlow360 system demonstrates a complete foundation for a modern deal management platform. The project successfully combines a React frontend, Express backend and MySQL database into a single full-stack application."
);

bullet("Working authentication flow.");
bullet("Authenticated SaaS workspace.");
bullet("Customer and deal-oriented application structure.");
bullet("Deal creation and pricing calculation support.");
bullet("Approval and operational modules.");
bullet("Fulfillment and inventory data model.");
bullet("Billing and customer portal interfaces.");
bullet("Structured REST API architecture.");
bullet("Relational database design.");
bullet("Production frontend build capability.");

// -----------------------------
// 22. Advantages
// -----------------------------

title("22. Advantages");

bullet("Centralized management of the deal lifecycle.");
bullet("Reduces dependency on disconnected spreadsheets and tools.");
bullet("Improves visibility across sales and operations.");
bullet("Provides consistent business calculations.");
bullet("Supports structured approval workflows.");
bullet("Connects deals with inventory and fulfillment.");
bullet("Provides a modern user experience.");
bullet("Uses scalable full-stack web technologies.");
bullet("Provides a strong foundation for intelligent automation.");

// -----------------------------
// 23. Limitations
// -----------------------------

title("23. Limitations");

paragraph(
  "The current version is a project implementation and therefore has several areas that can be expanded before production deployment."
);

bullet("Advanced AI-driven deal recommendations are not yet fully implemented.");
bullet("Production-grade role and permission management can be expanded.");
bullet("Automated notifications can be added.");
bullet("Advanced analytics and reporting can be enhanced.");
bullet("Payment gateway integration is outside the current implementation.");
bullet("Enterprise-scale deployment and monitoring would require additional infrastructure.");
bullet("Automated test coverage can be increased.");

// -----------------------------
// 24. Future Scope
// -----------------------------

title("24. Future Scope");

subheading("AI-Powered Deal Intelligence");

paragraph(
  "Future versions can introduce intelligent deal scoring, risk detection, margin optimization and recommendations based on historical business data."
);

subheading("Predictive Analytics");

paragraph(
  "Machine learning models can be used to forecast deal conversion probability, revenue and operational requirements."
);

subheading("Automated Approvals");

paragraph(
  "Rules and AI-based recommendations can automatically identify deals that require additional review."
);

subheading("Notifications");

paragraph(
  "Email, SMS or in-app notifications can inform users about approval requests, deal updates and fulfillment events."
);

subheading("Advanced Analytics");

paragraph(
  "Interactive dashboards can provide revenue trends, conversion rates, margin analysis, product performance and customer insights."
);

subheading("Enterprise Deployment");

paragraph(
  "The application can be deployed using cloud infrastructure with managed databases, containerization, monitoring, centralized logging and CI/CD pipelines."
);

// -----------------------------
// 25. Conclusion
// -----------------------------

title("25. Conclusion");

paragraph(
  "DealFlow360 demonstrates how a modern full-stack web application can centralize and simplify the business deal lifecycle. By connecting authentication, customers, deals, products, approvals, inventory, fulfillment and billing within a common platform, the system provides a more organized operational workflow."
);

paragraph(
  "The combination of React, TypeScript, Vite, Node.js, Express and MySQL provides a strong technical foundation for the application. The modular architecture also makes it possible to introduce advanced intelligence and automation features in future iterations."
);

paragraph(
  "Overall, DealFlow360 provides a practical and extensible solution for improving sales operations, deal visibility and cross-functional coordination while maintaining a professional SaaS-style user experience."
);

// -----------------------------
// Project Information
// -----------------------------

title("Project Information");

table(
  ["Item", "Details"],
  [
    ["Project Name", "DealFlow360"],
    ["Project Type", "Full-Stack SaaS / Deal Management Platform"],
    ["Frontend", "React + TypeScript + Vite"],
    ["Backend", "Node.js + Express"],
    ["Database", "MySQL"],
    ["API Style", "REST"],
    ["Version Control", "Git / GitHub"],
  ],
  [155, 330]
);

paragraph(
  "This report was generated programmatically using Node.js and PDFKit."
);

// -----------------------------
// Footer / Page Numbers
// -----------------------------

for (let i = 0; i < doc.bufferedPageRange().count; i++) {
  doc.switchToPage(i);
  addPageNumber();
}

doc.end();

stream.on("finish", () => {
  console.log("");
  console.log("==========================================");
  console.log("DealFlow360 PDF report generated!");
  console.log("==========================================");
  console.log("");
  console.log(`File: ${outputPath}`);
  console.log("");
});