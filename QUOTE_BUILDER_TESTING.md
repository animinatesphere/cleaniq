/\*\*

- QUOTE BUILDER TESTING GUIDE
- ==========================================
-
- This file provides instructions and curl commands to test the Quote Builder feature.
-
- FEATURES IMPLEMENTED:
- ✅ Admin Dashboard Link - Added "Quotes" to sidebar menu
- ✅ Frontend Route - /admin/quotes maps to QuoteBuilder.jsx component
- ✅ Backend API - POST /api/quotes/send
- ✅ Email Service - Professional quote template with Resend
- ✅ Recurring Support - Monthly/Weekly/Quarterly scheduling
- ✅ Quote History - Stored in memory (upgrade to DB in production)
-
- ==========================================
  \*/

// 1. ACCESS THE QUOTE BUILDER UI
// ──────────────────────────────────────────
// Navigate to: http://localhost:5173/admin/quotes
// Or click "Quotes" in the admin sidebar menu

// 2. TEST API ENDPOINT - SEND QUOTE
// ──────────────────────────────────────────
// Endpoint: POST /api/quotes/send
// Description: Send a professional quote to a company email

// Test Command (using curl):
// `bash
curl --location 'http://localhost:5000/api/quotes/send' \
  --header 'Content-Type: application/json' \
  --data '{
    "companyName": "Airbnb Host Services Ltd",
    "contactName": "Sarah Johnson",
    "email": "billing@airbnbhosts.co.uk",
    "phone": "+44 20 7946 0958",
    "address": "123 Business Park, London, EC1A 1BB",
    "frequency": "monthly",
    "validDays": 30,
    "vatRate": 20,
    "includeVat": true,
    "sendCopy": true,
    "quoteRef": "CLQ-' + Math.random().toString().slice(-6) + '",
    "date": "' + new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) + '",
    "items": [
      {
        "service": "Airbnb & Holiday Let Cleaning",
        "customService": "",
        "description": "Professional turnover cleaning for 3-bed Airbnb property",
        "qty": 4,
        "unitPrice": 150,
        "subtotal": 600
      },
      {
        "service": "Office Cleaning",
        "customService": "",
        "description": "Daily office spaces cleaning, Mon-Fri",
        "qty": 20,
        "unitPrice": 75,
        "subtotal": 1500
      }
    ],
    "subtotal": 2100,
    "vat": 420,
    "grandTotal": 2520,
    "notes": "This quote is valid for 30 days from the date of issue. All services are subject to our standard terms and conditions. Payment terms: Net 30 days. To proceed, please reply to this email or contact our team."
  }'
// `

// 3. TEST API ENDPOINT - GET ALL QUOTES
// ──────────────────────────────────────────
// Endpoint: GET /api/quotes
// Description: Retrieve all sent quotes with pagination

// Test Command:
// `bash
curl --location 'http://localhost:5000/api/quotes?limit=10&skip=0'
// `

// 4. TEST API ENDPOINT - GET SPECIFIC QUOTE
// ──────────────────────────────────────────
// Endpoint: GET /api/quotes/:quoteRef
// Description: Retrieve a specific quote by its reference number

// Test Command:
// `bash
curl --location 'http://localhost:5000/api/quotes/CLQ-123456'
// `

// 5. TEST API ENDPOINT - RESEND QUOTE
// ──────────────────────────────────────────
// Endpoint: POST /api/quotes/resend/:quoteRef
// Description: Resend an existing quote to same or different email

// Test Command:
// `bash
curl --location 'http://localhost:5000/api/quotes/resend/CLQ-123456' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "newemail@company.com"
  }'
// `

// 6. TEST API ENDPOINT - SCHEDULE RECURRING QUOTES
// ──────────────────────────────────────────────────
// Endpoint: POST /api/quotes/schedule
// Description: Set up recurring monthly/weekly quotes

// Test Command:
// `bash
curl --location 'http://localhost:5000/api/quotes/schedule' \
  --header 'Content-Type: application/json' \
  --data '{
    "companyName": "Office Cleaning Services Co",
    "email": "finance@officeclean.co.uk",
    "frequency": "monthly",
    "items": [
      {
        "service": "Office Cleaning",
        "description": "Daily office cleaning",
        "qty": 20,
        "unitPrice": 75
      }
    ],
    "subtotal": 1500,
    "grandTotal": 1800,
    "active": true
  }'
// `

// ==========================================
// FRONTEND TESTING
// ==========================================

// Step 1: Navigate to Admin Dashboard
// - Go to http://localhost:5173/admin (log in if required)
// - Click on "Quotes" in the left sidebar menu

// Step 2: Create a Quote
// - Fill in Company Details:
// _ Company Name: "Example Cleaning Company"
// _ Contact Person: "John Smith"
// _ Email: "john@example.com"
// _ Phone: "+44 7000 000000"
// _ Address: "Unit 1, Business Park, London"
//
// - Add Services:
// _ Select "Airbnb & Holiday Let Cleaning"
// _ Enter description: "2-bedroom property, turnover cleaning"
// _ Quantity: 4 visits
// _ Unit Price: £150
// _ Click "+ Add Service Line" to add more

// Step 3: Configure Quote Settings
// - Frequency: Select "Monthly" for recurring
// - VAT Rate: 20%
// - Include VAT: Yes (checked)
// - Valid Days: 30
// - Send Copy to Admin: Yes (checked)
// - Notes: "This quote is valid for 30 days..."

// Step 4: Preview and Send
// - Click "Preview" button to see quote format
// - Click "Send Quote" button to send to company email
// - Success message will appear when sent

// ==========================================
// EMAIL TESTING
// ==========================================

// Expected Email:
// - FROM: Cleaniq Services <info@cleaniqservices.com>
// - TO: billing@company.com
// - Subject: "Professional Service Quote - Ref: CLQ-XXXXX | Cleaniq Services"
// - Template: Professional invoice-style HTML with:
// _ Company logo
// _ Quote reference number
// _ Services table with items, quantities, and pricing
// _ Subtotal, VAT, and grand total
// _ Valid date range
// _ Terms and conditions
// \* Call to action button

// Admin Notification Email (if sendCopy enabled):
// - FROM: Cleaniq Services <info@cleaniqservices.com>
// - TO: info@cleaniqservices.com
// - Subject: "Quote Sent - Example Company | CLQ-XXXXX"
// - Content: Summary of sent quote with company details and total amount

// ==========================================
// DATA STRUCTURE REFERENCE
// ==========================================

const quotePayload = {
companyName: "string", // Required: Company name
contactName: "string", // Optional: Contact person name
email: "string", // Required: Company email
phone: "string", // Optional: Phone number
address: "string", // Optional: Company address
frequency: "once|weekly|biweekly|monthly|quarterly", // Quote frequency
quoteRef: "string", // Generated: Quote reference
date: "string", // Generated: Quote date
validDays: number, // Days quote is valid
vatRate: number, // VAT percentage
includeVat: boolean, // Include VAT in calculation
sendCopy: boolean, // Send admin notification
items: [
{
service: "string", // Service name or empty if custom
customService: "string", // Custom service name if selected
description: "string", // Service description
qty: number, // Quantity or number of visits
unitPrice: number, // Price per unit
subtotal: number, // qty * unitPrice
}
],
subtotal: number, // Sum of all items
vat: number, // VAT amount
grandTotal: number, // subtotal + vat
notes: "string", // Terms and conditions
};

// ==========================================
// RESPONSE EXAMPLES
// ==========================================

// Successful Quote Send Response:
const successResponse = {
success: true,
message: "Quote sent successfully to john@example.com",
quoteRef: "CLQ-567890",
};

// Error Response:
const errorResponse = {
success: false,
message: "Missing required fields: email, companyName, or items",
};

// Quote History Response:
const historyResponse = {
success: true,
data: [
{
quoteRef: "CLQ-123456",
companyName: "Airbnb Hosts Ltd",
email: "billing@airbnb.co.uk",
frequency: "monthly",
subtotal: 2000,
vat: 400,
grandTotal: 2400,
createdAt: "2026-06-18T10:30:00.000Z",
status: "sent",
},
],
total: 1,
};

// ==========================================
// PRODUCTION NOTES
// ==========================================

/\*

1. DATABASE INTEGRATION
   - Currently quotes are stored in memory (sentQuotes array)
   - For production, create MongoDB Quote model:

   const QuoteSchema = new Schema({
   quoteRef: { type: String, unique: true },
   companyName: String,
   email: String,
   phone: String,
   address: String,
   frequency: String,
   items: [{ service, quantity, unitPrice }],
   grandTotal: Number,
   status: String,
   createdAt: { type: Date, default: Date.now },
   sentAt: Date,
   validUntil: Date,
   });

2. RECURRING QUOTE SCHEDULING
   - Currently logs schedule creation
   - For production, implement:
     a) Cron job (node-cron) to send recurring quotes
     b) Job queue (Bull, RabbitMQ) for reliability
     c) Scheduled tasks in database

3. EMAIL IMPROVEMENTS
   - Add quote PDF attachment
   - Implement quote tracking (opens, clicks)
   - Add payment link for direct checkout
   - Customize email template per company

4. SECURITY
   - Add authentication/authorization checks
   - Validate email addresses
   - Implement quote expiry
   - Add audit logging for all quote activities

5. ADMIN FEATURES TO ADD
   - View quote history dashboard
   - Edit/update sent quotes
   - Track quote status (sent, viewed, accepted, declined)
   - Generate reports
   - Bulk quote sending
   - Quote templates for quick creation

6. CUSTOMER FEATURES TO ADD
   - Customer can view their quotes
   - Accept/decline quotes
   - Provide feedback
   - Download quote as PDF
     \*/

module.exports = {
testData: quotePayload,
successResponse,
errorResponse,
historyResponse,
};
