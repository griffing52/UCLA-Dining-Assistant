# UCLA-Dining-Assistant

## Introduction

Don't have enough time to check what's on the UCLA dining website every day? Get tailored email summaries every morning about foods that best fit for you.
<img width="928" height="441" alt="image" src="https://github.com/user-attachments/assets/dff9f4a7-c4a9-4e95-bef9-9df8dddaa4db" />

## Quick Setup
1. Get Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open [Google Apps Script](https://script.google.com/)
3. Create project and navigate to Project Settings
4. At the bottom, you'll see Script Properties
<img width="744" height="164" alt="image" src="https://github.com/user-attachments/assets/043846f3-eedb-4f99-837a-9c3af84615f7" />

5. Click "Add script property" to securely add our Gemini API key

<img width="776" height="249" alt="image" src="https://github.com/user-attachments/assets/cb474795-3114-4d76-bbc9-0391f7822952" />

6. Press "Save script properties"
7. Go to Apps Script Editor
8. Paste Code.gs script into the editor
9. Fill in the USER_CONFIG section email, preferences, and restaurants
```
// Your email address to send the summary to.
email: "example@gmail.com",

// Your natural language food preferences.
// Examples: "I want high-protein vegan options.", 
//           "Looking for something light and healthy, preferably fish or chicken.",
//           "Comfort food! I'm in the mood for pizza, pasta, or a good burger."
preferences: "Looking for something light and healthy, preferably chicken or fish. I like poke as well as the food trucks Pinch of Flavor, Rice Balls of Fire, and Aloha Fridays. I'm willing to change things up if it sounds good.", 

// Set to `true` to check a restaurant, `false` to skip it.
// This changes which restaurants are considered in the search
restaurants: {
  "bruin-cafe": true,
  "bruin-plate": true,
  "cafe-1919": true,
  "de-neve-dining": true,
  "epicuria-at-ackerman": true,
  "epicuria-at-covel": true,
  "rendezvous": true,
  "spice-kitchen": true,
  "the-drey": t,
  "the-study-at-hedrick": true,
  "meal-swipe-exchange": false, // This is for the Food Trucks
},
```
10. If not already already, the Cheerio library and Gmail service should be addedd
<img width="228" height="174" alt="image" src="https://github.com/user-attachments/assets/c0a99a07-e1d3-458d-970c-a12bfe1535e7" />

11. Go to Triggers -> Add Trigger with the following settings, changing "Select time of day" if desired
<img width="692" height="804" alt="image" src="https://github.com/user-attachments/assets/8bbd0494-0b1b-49dd-b0f1-452a8c9fb00a" />

## Libraries and Services
- Cheerio for scraping from DOM
- Gmail for emailed result

## Future
- More stylized email format
- Give more detailed responses (include meal period)
