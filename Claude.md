# ParkPace — Project Overview

**Last updated:** 2026-08-20  
**Author:** Gary Starr, (gstarr@gstarr.org)  
**Status:** This file is the single source of truth for ParkPace. `GEMINI.md` is retained for reference only and should not be updated going forward — all architectural decisions live here.  
**Project location:** `C:\Users\gstarr\parkpace` (moved off OneDrive to avoid sync conflicts with node_modules/build files)

---

## What We're Building

ParkPace is a mobile app compatible with iOS and Android for those planning a trip to Disney World and to use while at Disney World. The app will assist with navigation, day to day itinerary, ride wait times, rides down, show times, scheduling, lightning lane suggestions, crowds, weather, hours, other suggestions for making the day enjoyable for a family.  It will cover Magic Kingdom, Epcot, Hollywood Studios and Animal Kingdom. 

This is to be a paid app with a 1 year subscription.  Tentative price $9.99 for first phase.  $14.99 for additional features included on future phases. 

Future phases will include restaurant guides, hotel guide and perks, special events, best time to visit, and more.

---

## Copyright / Trademark

Nominative Fair Use is permitted for highlighting, referencing or describing things.  Do Not Use any copyrighted or trademarked Disney images or sounds.

---

## Color Scheme

Royal Blue, Gold, Deep Purple, Advice colors as we progress
App must have a positive UI

---

## Tech Stack

-- Initially will be built locally on laptop for proof of concept. 

-- Themeparks.wiki will be utilized for their API information on wait times, ride status, etc.

-- Mobile app: React Native with Expo

-- Backend: Node.js + Fastify or Express

-- Database: PostgresSQL

-- Auth: Supabase Auth or Clerk

-- Subscription / billing: RevenueCat (handles Apple StoreKit + Google Play Billing for the 1-year subscription, since digital subscriptions can't be sold via direct credit card charge inside the app per App Store / Play Store rules)

-- Privacy Policy: required before app store submission for any app with user accounts and/or location data — needs to be drafted and hosted (e.g. simple page on the eventual marketing site) before Phase 1 submission

---

## Rules

-- Always ask questions
-- Do not make changes unless approved
-- Always advice - You are smarter
-- Do not assume anything
-- After approval for changes, you do not need to ask me yes or no at every step, just perform actions needed to complete that task
-- Remember we are moving away from Google Sheets and to this custom program/app
-- I am in Tampa, Florida in the EST time zone
-- Place everything into memory that we have completed or discussed for next steps, create document at end of each day when I say goodnight if required.

---

## Current Infrastructure

-- Moving to Claude Code (paid) for hands-on file editing/command execution — Claude web used for planning up to this point
-- Node.js v24.19.0, npm v11.17.0 confirmed on dev machine (2026-08-20)
-- Project location: C:\Users\gstarr\parkpace (local drive, not OneDrive) to avoid file-sync conflicts with node_modules/build artifacts during development
-- Git repo: not yet initialized — do this next
-- Expo app: scaffolded via create-expo-app, blank-typescript template
-- Expo SDK pinned to ~54.0.37 to match the Expo Go client version available on the App/Play Store (Expo Go on stores is capped at SDK 54 as of Aug 2026 — newer SDKs require a development build instead)
-- Expo Go confirmed working on Android device, connected via QR code

---

## Progress Log

**2026-08-20**
-- Scaffolded Expo app, resolved SDK/Expo Go version mismatch (pinned to SDK 54)
-- Built first working screen: live Magic Kingdom wait times pulling directly from themeparks.wiki API (entity ID 75ea578a-adc8-4116-a54d-dccb60765ef9), no backend yet
-- Confirmed working end-to-end on Gary's Android phone via Expo Go
-- Styled with Royal Blue / Gold / Deep Purple per color scheme

**Next steps (not yet started)**
-- Add remaining three parks (Epcot, Hollywood Studios, Animal Kingdom) with a park picker/tabs
-- Stand up Node.js/Fastify backend to poll and cache themeparks.wiki data instead of hitting it directly from the app
-- Add React Navigation (tabs/stack) — currently a single blank screen, no navigation structure yet
-- Initialize git repo (not yet done)
