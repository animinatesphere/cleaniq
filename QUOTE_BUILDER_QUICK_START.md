# 🚀 Quote Builder - Quick Start

## What's Ready to Use Right Now

Your quote builder is fully integrated and ready! Here's what's set up:

### ✅ Completed Setup:

1. **Admin Dashboard Link** - "Quotes" menu item in sidebar
2. **Frontend Component** - Professional quote builder interface
3. **Backend API** - `/api/quotes/send` endpoint
4. **Email Service** - Integrated with Resend
5. **Recurring Support** - Weekly, monthly, quarterly options
6. **Quote History** - Tracks sent quotes locally

---

## 📋 How to Get Started (3 Steps)

### Step 1: Start Your Server

```bash
cd server
npm start
```

### Step 2: Start Your Frontend

```bash
npm run dev
```

### Step 3: Go to Admin Quotes

1. Navigate to: `http://localhost:5173/admin`
2. Log in to admin
3. Click "Quotes" in the left sidebar
4. You're in! 🎉

---

## 🎯 First Quote - Try This

### Scenario: Send Monthly Cleaning Quote to Airbnb Host

**Step 1: Company Details**

- Company Name: `Airbnb Portfolio Ltd`
- Contact: `Sarah Johnson`
- Email: `sarah@airbnbhosts.co.uk`
- Phone: `+44 20 7946 0958`
- Address: `123 Business Park, London`

**Step 2: Add Services**
Click "+ Add Service" and add:

**Service 1: Property Turnover**

- Service: `Airbnb & Holiday Let Cleaning`
- Description: `3-bed property, turnover between guests`
- Quantity: `4` (visits per month)
- Unit Price: `£150`

**Service 2: Deep Clean**

- Service: `Deep Cleaning`
- Description: `Monthly deep clean & carpet refresh`
- Quantity: `1`
- Unit Price: `£200`

**Step 3: Quote Settings**

- Frequency: `Monthly`
- VAT Rate: `20%`
- Include VAT: ✅ (checked)
- Valid Days: `30`
- Send Copy: ✅ (checked)
- Notes: `This is a monthly recurring service. All prices include VAT. Payment terms: Net 30.`

**Step 4: Send It**

1. Click "Preview" to see how it looks
2. Click "Send Quote"
3. Success! ✅ Quote sent to sarah@airbnbhosts.co.uk

---

## 📊 What the Customer Receives

Email arrives with:

- ✅ Professional Cleaniq branding & logo
- ✅ Quote reference number (e.g., CLQ-567890)
- ✅ Date & validity period
- ✅ Company details section
- ✅ Services table with:
  - Service name & description
  - Quantity
  - Unit price
  - Total per item
- ✅ Pricing summary:
  - Subtotal
  - VAT (20%)
  - **Grand Total: £1,720/month**
- ✅ Recurring indicator showing "Monthly"
- ✅ Terms & conditions
- ✅ "Get Started Today" button
- ✅ Cleaniq contact info

---

## 🔁 Frequency Types

Choose one when creating a quote:

| Frequency     | When Sent     | Example                 |
| ------------- | ------------- | ----------------------- |
| **One-time**  | Once          | Ad-hoc cleaning project |
| **Weekly**    | Every 7 days  | £700/week               |
| **Bi-weekly** | Every 14 days | £1,400/fortnight        |
| **Monthly**   | Every 30 days | £3,000/month            |
| **Quarterly** | Every 90 days | £9,000/quarter          |

---

## 📱 Features Available Now

### In the Interface:

- ✅ Add/remove line items
- ✅ Select predefined services or enter custom
- ✅ Set quantities and pricing
- ✅ Auto-calculate subtotals
- ✅ Adjust VAT rate
- ✅ Set validity period (days)
- ✅ Add custom notes/terms
- ✅ Preview before sending
- ✅ See recent quote history

### Email Features:

- ✅ Professional HTML template
- ✅ Auto-formatted pricing table
- ✅ Company logo & branding
- ✅ Automatic VAT calculations
- ✅ Recurring indicator if applicable
- ✅ Terms section
- ✅ Call-to-action button

### Admin Features:

- ✅ Send to multiple companies
- ✅ Track sent quotes locally
- ✅ Get admin notification when sent
- ✅ Customize all quote details

---

## 🧪 Try the API Directly

Want to test without the UI? Use curl:

```bash
curl -X POST http://localhost:5000/api/quotes/send \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company Ltd",
    "email": "test@company.com",
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
    "vat": 300,
    "grandTotal": 1800,
    "validDays": 30,
    "notes": "Monthly recurring service"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Quote sent successfully to test@company.com",
  "quoteRef": "CLQ-123456"
}
```

---

## 📧 Check Your Emails

**Customers receive:**

- To: billing@company.com
- Subject: `Professional Service Quote - Ref: CLQ-XXXXX | Cleaniq Services`
- Beautiful HTML email with full quote details

**You receive (admin copy):**

- To: info@cleaniqservices.com (or your EMAIL_USER)
- Subject: `Quote Sent - Company Name | CLQ-XXXXX`
- Summary notification

---

## 🎓 Real-World Examples

### Example 1: Airbnb Cleaning Service

```
Company: Holiday Let Properties Ltd
Contact: John Smith
Services:
  - Turnover Cleaning: 8 visits/month @ £120
  - Deep Clean: 1 visit/month @ £250
Frequency: Monthly
Total: £1,210/month (incl. 20% VAT)
```

### Example 2: Office Cleaning Contract

```
Company: Corporate Services UK
Contact: Finance Department
Services:
  - Daily Office Cleaning: 20 visits/month @ £75
  - Weekly Deep Clean: 4 times/month @ £150
  - Monthly Carpet Shampoo: 1 time @ £300
Frequency: Monthly
Total: £3,000/month
```

### Example 3: One-Time Project

```
Company: New Office Build Ltd
Services:
  - Post-Construction Cleaning: £1,500
  - Windows & Blinds: £300
  - Carpet Installation Cleaning: £400
Frequency: One-time
Total: £2,200 (incl. VAT)
```

---

## ✨ Ready to Sell!

You can now:

1. ✅ Create professional quotes for any company
2. ✅ Email directly from admin dashboard
3. ✅ Set up recurring monthly/weekly/quarterly billing
4. ✅ Track all sent quotes
5. ✅ Add terms and customizations
6. ✅ Include multiple service line items
7. ✅ Calculate VAT automatically

---

## 🔧 What Happens Behind the Scenes

When you "Send Quote":

1. ✅ Quote validated
2. ✅ Quote reference generated (CLQ-XXXXX)
3. ✅ Professional HTML email created
4. ✅ Sent via Resend to company email
5. ✅ Admin copy sent to info@cleaniqservices.com
6. ✅ Quote stored in history
7. ✅ Success notification shown

---

## 💾 Where Quotes Are Stored

Currently: **Local memory** (in sentQuotes array)

- Persists while server is running
- Lost on server restart
- Shows in recent history on dashboard

Next step: **Database** (MongoDB recommended)

- Permanent storage
- Query/filter/report capabilities
- Track status (sent, viewed, accepted)

---

## ❓ Common Questions

**Q: Can I edit a quote after sending?**
A: Currently no. You'd create a new one. Future enhancement: Edit & resend.

**Q: Do customers receive the email immediately?**
A: Yes! Via Resend email service.

**Q: Can I send to multiple companies at once?**
A: Currently one at a time. Future: Bulk send.

**Q: What if my email fails?**
A: You'll see an error message. Check:

- Email address is valid
- RESEND_API_KEY in `.env`
- Server is running

**Q: Can I download the quote as PDF?**
A: Future feature. Currently email-only.

**Q: Does the customer get the quote in their email?**
A: Yes, as formatted HTML email. They can print it from there.

---

## 🚀 Next Steps (Optional)

Want to enhance it further?

1. **Recurring Automation**
   - Set up cron job for auto-sending monthly quotes
   - See QUOTE_BUILDER_SETUP.md for details

2. **Database Storage**
   - Save quotes to MongoDB
   - Track quote lifecycle
   - Generate reports

3. **PDF Exports**
   - Generate PDF attachments
   - Download link in email
   - Customer archive

4. **Payment Integration**
   - Add payment button in email
   - Direct checkout
   - Invoice tracking

---

## 🎯 Summary

- ✅ Your Quote Builder is ready NOW
- ✅ Go to `/admin/quotes` to start
- ✅ Send your first quote in 2 minutes
- ✅ Professional emails arrive instantly
- ✅ Track all quotes in history

**Let's go! Create your first quote now!**

For questions, see:

- [QUOTE_BUILDER_SETUP.md](QUOTE_BUILDER_SETUP.md) - Full documentation
- [QUOTE_BUILDER_TESTING.md](QUOTE_BUILDER_TESTING.md) - API reference & cURL examples
