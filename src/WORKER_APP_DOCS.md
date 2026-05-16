# CleanIQ Worker App - Architecture & Flow Documentation

This document outlines the architecture, user flows, and technical requirements for the CleanIQ Worker Mobile App (iOS & Android). This app connects your hired cleaners to incoming bookings based on their location.

## 1. Authentication & Onboarding Flow (How Workers Login)

To maintain security and quality control, workers cannot sign up freely on the app. Instead, we use an **Admin-Invitation Model**.

### Step-by-Step Onboarding:
1. **Application & Interview**: The worker applies via a form on your main website. You (the Admin) conduct the interview outside the app.
2. **Admin Approval**: Once you decide to hire them, you go to your CleanIQ Admin Dashboard and click a new **"Add Worker"** button. You input their Name, Phone, Email, and Service Region (UK/NG).
3. **Account Generation**: The backend automatically creates a Worker Profile in the database and generates a secure, random **Temporary Password**.
4. **Welcome Email/SMS**: The system sends an automated welcome message to the worker containing:
   - A link to download the iOS App (App Store).
   - A link to download the Android App (APK file).
   - Their Login Credentials (Email + Temporary Password).
5. **First Login**: The worker downloads the app, enters the credentials sent to them, and logs in.
6. **Mandatory Setup**: Upon first login, the app forces the worker to:
   - Change their temporary password to a new, secure one.
   - Upload a profile picture (which customers will see later).
   - **Enable Location Services (GPS)** so the app can match them with nearby jobs.

## 2. Job Broadcasting & Acceptance Flow (Order Management)

When a customer books a cleaning on the main website, the system automatically routes that booking to the right workers.

### Step-by-Step Order Flow:
1. **New Booking**: A customer completes a booking. The booking is saved in the database with `Status: Pending`.
2. **Geo-Targeted Broadcast**: The backend checks the booking location (via Postcode or Coordinates) and finds all active workers within a specific radius (e.g., 10 miles) who have that time slot free.
3. **Push Notification**: The app sends an instant Push Notification to those matched workers: *"🚨 New Job Available: Deep Clean in Manchester, 3 hours, £75."*
4. **Job Feed**: Workers open the app and see the job details in their "Available Jobs" list. They can see the general area, pay, and required services (the exact house number is hidden for privacy).
5. **Acceptance (First-Come, First-Served)**: The first worker to tap **"Accept Job"** is assigned to it.
6. **System Update**: 
   - The booking status updates to `Status: Assigned`.
   - The job instantly disappears from all other workers' apps.
   - The accepted worker now sees the full exact address, entry instructions, and customer notes.
7. **Notifications Sent**: 
   - An email is sent to the Admin: *"Worker [Name] accepted booking [ID]."*
   - An email is sent to the Customer: *"Great news! [Worker Name] has been assigned to your cleaning."*

## 3. Admin Dashboard Integration

Your current Admin panel will be expanded to manage this new ecosystem.

- **Worker Management Tab**: A new page to view all hired workers, see their current status (Active/Suspended), view their average ratings, and see total jobs completed.
- **Booking Modal Update**: The existing booking details modal (where you see Pricing & Logistics) will have a new **"Assigned Worker"** section. If a job is accepted, it shows the worker's name and photo.
- **Manual Override**: The Admin retains full control. You can manually un-assign a worker from a job and re-assign it to someone else if there is an emergency or a no-show.

## 4. Tech Stack Recommendations for the App

To build this app quickly and integrate it with your current React system:

- **Framework**: **React Native (with Expo)**. Since your website is built with React, React Native is the perfect choice. You write the code once, and Expo builds BOTH the Android APK and the iOS app.
- **Push Notifications**: **Expo Push Notifications** or **Firebase Cloud Messaging (FCM)** to send the instant job alerts to workers' phones.
- **Location Tracking**: Expo Location API to track worker coordinates and match them to nearby jobs.
- **Database**: Your existing MongoDB database. We will simply add a new `Workers` collection and update the `Bookings` collection to include a `workerId` field.
