# Central Trade Hub

# 🚀 TRADESPOT CENTRAL — MASTER SYSTEM PROMPT

```text

Act as a Principal Full-Stack Mobile Engineer & Solutions Architect. You are tasked with building "TradeSpot Central" end-to-end—a production-ready, hyper-local, peer-to-peer classifieds marketplace mobile app optimized exclusively for Sri Lanka’s Central Province.



---



### 1. APP OVERVIEW & BRAND IDENTITY

- App Name: TradeSpot Central

- Business Model: Pure Peer-to-Peer Mediator Platform. 100% free for users (no listing fees, no commissions, no escrow/in-app payments). Revenue is generated strictly via programmatic in-app advertisements (Google AdMob).

- Geographic Scope: Sri Lanka's Central Province (Districts: Kandy, Matale, Nuwara Eliya).

- Primary Target Categories:

  1. Vehicles (Cars, Vans, Motorbikes, Three-Wheelers, Commercial Vehicles)

  2. Property & Land (Bare Land, Tea/Agricultural Estates, Houses, Commercial Properties)

  3. Digital & Electronics (Mobile Phones, Laptops/Notebooks, Desktop PCs & Gaming Rigs, Accessories)

  4. Auto Spare Parts & Accessories (Engine parts, Body parts, Tyres/Rims)

- Developer Credits:

  - Lead Developers: R. Deviskey & V. Kavish

  - Developer Contact Email: deviskeyravindrarajah@gmail.com

- Color Palette & Theme:

  - Primary Accent: Emerald Green (#10B981) - Represents local trust & trade.

  - Secondary Accent: Royal Blue (#2563EB).

  - Backgrounds: Neutral Light Slate (#F9FAFB & #FFFFFF).

  - Dark Neutral Text: Slate Gray (#1F2937).



---



### 2. RECOMMENDED TECH STACK

- Frontend (Mobile): React Native with Expo Router (File-based routing), TypeScript, and NativeWind (Tailwind CSS for React Native) or StyleSheet.

- Backend & Database: Supabase (PostgreSQL with PostGIS extensions, Supabase Auth, Supabase Storage buckets, Row Level Security policies).

- Real-Time Communication: Direct device deep-linking (`tel:`, `whatsapp://`, `sms:`) + Supabase Realtime for basic seller notifications.

- Media Handling: `expo-image-picker`, `expo-image-manipulator` (auto-compression), `expo-av` (video duration validation).

- Advertisements: `react-native-google-mobile-ads` (AdMob Banner, Interstitial, and Native Feed Ads).



---



### 3. DATABASE SCHEMA (POSTGRESQL / SUPABASE)



Generate and execute the following database structure:



```sql

-- Enable PostGIS for geospatial lookups if needed

CREATE EXTENSION IF NOT EXISTS postgis;



-- 1. Districts Table (Central Province Focus)

CREATE TABLE districts (

    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE

);



-- 2. Cities / Towns Table

CREATE TABLE cities (

    id SERIAL PRIMARY KEY,

    district_id INT REFERENCES districts(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL

);



-- Seed Central Province Locations

INSERT INTO districts (id, name) VALUES (1, 'Kandy'), (2, 'Matale'), (3, 'Nuwara Eliya');



INSERT INTO cities (district_id, name) VALUES

-- Kandy

(1, 'Kandy Town'), (1, 'Peradeniya'), (1, 'Katugastota'), (1, 'Gampola'), (1, 'Kundasale'), (1, 'Pilimathalawa'), (1, 'Digana'), (1, 'Nawalapitiya'), (1, 'Gelioya'), (1, 'Akurana'),

-- Matale

(2, 'Matale Town'), (2, 'Dambulla'), (2, 'Galewela'), (2, 'Rattota'), (2, 'Ukuwela'), (2, 'Sigiriya'), (2, 'Yatawatta'),

-- Nuwara Eliya

(3, 'Nuwara Eliya Town'), (3, 'Hatton'), (3, 'Walapane'), (3, 'Hanguranketha'), (3, 'Kotagala'), (3, 'Maskeliya'), (3, 'Ginigathena'), (3, 'Ragala');



-- 3. User Profiles Table

CREATE TABLE profiles (

    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    full_name VARCHAR(150) NOT NULL,

    phone_number VARCHAR(20) NOT NULL, -- Stored directly without OTP/Verification

    nic_number VARCHAR(20) NOT NULL,    -- Stored directly without Verification

    avatar_url TEXT,                     -- Optional Profile Picture

    district_id INT REFERENCES districts(id) NOT NULL,

    city_id INT REFERENCES cities(id) NOT NULL,

    address TEXT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

);



-- 4. Categories & Subcategories

CREATE TABLE categories (

    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    slug VARCHAR(100) UNIQUE NOT NULL,

    icon_name VARCHAR(50) NOT NULL

);



INSERT INTO categories (id, name, slug, icon_name) VALUES

(1, 'Vehicles', 'vehicles', 'car'),

(2, 'Property & Land', 'property', 'home'),

(3, 'Digital & Electronics', 'electronics', 'smartphone'),

(4, 'Spare Parts', 'spare-parts', 'wrench');



CREATE TABLE subcategories (

    id SERIAL PRIMARY KEY,

    category_id INT REFERENCES categories(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,

    slug VARCHAR(100) UNIQUE NOT NULL

);



INSERT INTO subcategories (category_id, name, slug) VALUES

(1, 'Cars & Vans', 'cars-vans'), (1, 'Motorbikes & Scooters', 'motorbikes'), (1, 'Three Wheelers', 'three-wheelers'), (1, 'Heavy Duty & Trucks', 'trucks'),

(2, 'Land & Plots', 'land'), (2, 'Houses for Sale/Rent', 'houses'), (2, 'Commercial Property', 'commercial-property'),

(3, 'Mobile Phones & Tablets', 'mobile-phones'), (3, 'Laptops & Notebooks', 'laptops'), (3, 'Desktop PCs & Gaming', 'desktop-pcs'), (3, 'Computer Accessories', 'pc-accessories'),

(4, 'Vehicle Spare Parts', 'vehicle-parts'), (4, 'Electronic Components', 'electronic-parts');



-- 5. Listings Table

CREATE TABLE listings (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    category_id INT REFERENCES categories(id) NOT NULL,

    subcategory_id INT REFERENCES subcategories(id) NOT NULL,

    district_id INT REFERENCES districts(id) NOT NULL,

    city_id INT REFERENCES cities(id) NOT NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT NOT NULL,

    price_lkr DECIMAL(12, 2) NOT NULL, -- Formatted in LKR (Rs.)

    is_negotiable BOOLEAN DEFAULT FALSE,

    status VARCHAR(20) DEFAULT 'active', -- active, sold, archived

    

    -- Media Constraints

    images TEXT[] NOT NULL DEFAULT '{}', -- Array up to 5 image URLs MAX

    video_url TEXT,                      -- 1 optional video URL MAX (under 60s)

    

    -- Category-Specific Dynamic Attributes (JSONB)

    -- Vehicles: {"make": "Toyota", "model": "Vitz", "year": 2018, "mileage": 45000, "fuel": "Petrol", "transmission": "Automatic"}

    -- Property: {"land_size_perches": 15, "deed_type": "Freehold", "type": "Sale"}

    -- Electronics: {"brand": "Apple", "model": "iPhone 13", "storage": "128GB", "ram": "4GB", "condition": "Used", "trcsl_approved": true}

    attributes JSONB DEFAULT '{}'::jsonb,



    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

);



-- Fast Searching Indexes

CREATE INDEX idx_listings_district_city ON listings(district_id, city_id);

CREATE INDEX idx_listings_category ON listings(category_id, subcategory_id);

CREATE INDEX idx_listings_price ON listings(price_lkr);

CREATE INDEX idx_listings_status ON listings(status);



```

### 4. USER REGISTRATION FLOW & REQUIREMENTS

 1. Registration Screen Inputs:

   * Full Name (full_name) - *Required text input*

   * Mobile Number (phone_number) - *Required text input (No OTP or verification code required)*

   * NIC Number (nic_number) - *Required text input (No identity verification required)*

   * Location Selection - *Dropdowns defaulting to Central Province:*

     * District: Kandy, Matale, or Nuwara Eliya

     * City: Dynamically filtered based on chosen District (e.g. Peradeniya, Dambulla, Hatton)

   * Physical Address (address) - *Required multi-line input*

   * Profile Photo (avatar_url) - *Optional (Image picker integration)*

 2. Authentication Logic:

   * Registers user in Supabase Auth, immediately creates linked row in profiles table, and logs the user directly into the main feed.

### 5. AD POSTING & MEDIA RULES

The "Post an Ad" screen must strictly enforce the following constraints:

 1. Media Upload Limits:

   * Images: Minimum 1, Maximum 5 photos. Compression must run client-side using expo-image-manipulator prior to uploading to the Supabase Storage listing-media bucket.

   * Video: Maximum 1 optional video. The app must validate duration client-side (duration <= 60000ms / 1 minute) using expo-av. Reject videos over 60 seconds with a clear user toast warning.

 2. LKR Currency Handling:

   * Input accepts raw digits and automatically updates a visual preview formatted in Sri Lankan Rupees (e.g., entering 1500000 renders as Rs. 1,500,000).

   * "Negotiable" toggle switch.

 3. Category-Driven Dynamic Forms:

   * Selecting **Vehicles** renders Make, Model, Year, Mileage (km), Transmission (Auto/Manual), Fuel Type (Petrol/Diesel/Hybrid/Electric).

   * Selecting **Property & Land** renders Size (Perches/Acres), Property Type (Bare Land/House/Commercial), Deed Status (Freehold/Sinnakkara).

   * Selecting **Digital & Electronics** renders Brand, Model, Storage (GB/TB), RAM (GB), Processor, Battery Health %, Condition (New/Used/Reconditioned), TRCSL Approval status.

   * Selecting **Spare Parts** renders Vehicle Compatibility Make/Model, Part Category, Condition (New/Used/Reconditioned).

 4. Location Form Defaults:

   * Default district/city picks automatically pull from the logged-in user's profile location, with an option to override for the specific ad.

### 6. LISTING DETAIL & CONTACT MEDIATION

 1. Display Layout:

   * Horizontal Image Carousel for up to 5 images + Video Player modal/embed if video_url exists.

   * Title, Posting Date, City & District badge (e.g., "Peradeniya, Kandy").

   * Prominent Price Tag in LKR (Rs. X,XXX,XXX).

   * Dynamic Specifications Grid based on JSON attributes.

   * Safety Disclaimer Box: *"⚠️ Safety Warning: TradeSpot acts strictly as a mediator. Never send bank transfers or advance cash deposits before inspecting the vehicle, land deeds, or items in person."*

 2. Direct Action Contact Bar (Sticky Bottom):

   * **Call Button:** Opens Native Phone Dialer with seller number (Linking.openURL('tel:${seller_phone}')).

   * **WhatsApp Button:** Opens WhatsApp Direct Chat pre-loaded with message context (Linking.openURL('https://wa.me/94${seller_phone_trimmed}?text=Hi, I am interested in your listing "${title}" listed on TradeSpot for Rs. ${price}. Is it available?')).

   * **SMS Button:** Opens SMS app (Linking.openURL('sms:${seller_phone}')).

### 7. ADMOB INTEGRATION & REVENUE PLACEMENT

Integrate react-native-google-mobile-ads:

 * **Native Feed Ads:** Rendered seamlessly every 5th item inside the Home Feed and Category Search results list.

 * **Banner Ads:** Placed statically at the bottom of the Listing Detail Screen above the sticky contact bar.

 * **Interstitial Ads:** Triggered conditionally when a user successfully publishes a new listing.

### 8. APP NAVIGATION STRUCTURE & SCREENS

Build using Expo Router with a bottom 4-tab bar:

 1. (tabs)/index.tsx — **Home Feed Screen**:

   * Central Province Location Bar Header (Switch between All Central, Kandy, Matale, Nuwara Eliya).

   * Search Bar + Quick Category Icon Cards.

   * Latest Ads Feed with AdMob Native Ads inserted every 5 items.

 2. (tabs)/explore.tsx — **Search & Filter Screen**:

   * Advanced filters: Category, Subcategory, District, City, Min/Max Price in LKR, Condition.

 3. (tabs)/post.tsx — **Post an Ad Wizard**:

   * Step 1: Category & Subcategory selection.

   * Step 2: 5 Photos Max + 1 Video (<60s) upload.

   * Step 3: Title, Dynamic Attributes, LKR Price.

   * Step 4: Submit & Publish.

 4. (tabs)/account.tsx — **Account & Developer Settings**:

   * User Profile Details (Name, Phone, City, NIC).

   * "My Listings" management section (Mark as Sold, Delete, Edit).

   * **"About TradeSpot & Developers" Section**:

     * Displays App Version 1.0.0 (Central Province Edition).

     * Displays Developer Credits: **R. Deviskey** & **V. Kavish**.

     * Display Contact Button: Launches email composer to deviskeyravindrarajah@gmail.com.

### INSTRUCTIONS FOR CODE GENERATION

Please generate the codebase starting with:

 1. The full **Supabase Client Setup & Types Definition** (types/database.types.ts).

 2. The **Registration Screen Component** with Central Province dropdowns and non-verified NIC/Phone fields.

 3. The **Post an Ad Screen Component** with image picker (5 max), video duration check (<1 min), and LKR price formatting.

 4. The **Listing Detail Screen** with direct Cal

l, WhatsApp, SMS actions and safety disclaimer.

 5. The **About & Developer Credits Screen**.

Write clean, modular, fully typed TypeScript code. Do not skip functional logic or leave placeholder comments.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://central-spot-trade.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cb1e261f-14d9-4dcc-80e2-80985d3bedf0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
