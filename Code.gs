// =======================================================================
// USER CONFIGURATION - EDIT THESE VALUES
// =======================================================================

// set API key under Project Settings -> Script Properties
const API_KEY = PropertiesService.getScriptProperties().getProperty('API_KEY');

const USER_CONFIG = {
  // Your email address to send the summary to.
  email: "<YOUR EMAIL GOES HERE>", 

  // Your natural language food preferences.
  // Examples: "I want high-protein vegan options.", 
  //           "Looking for something light and healthy, preferably fish or chicken.",
  //           "Comfort food! I'm in the mood for pizza, pasta, or a good burger."
  preferences: "Looking for something light and healthy, preferably chicken or fish. I like poke as well as the food trucks Pinch of Flavor, Rice Balls of Fire, and Aloha Fridays. I'm willing to change things up if it sounds good.", 
  
  // Set to `true` to check a restaurant, `false` to skip it.
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

  // Your Google Gemini API Key. Set automatically if first step followed properly.
  geminiApiKey: API_KEY, 
};

// =======================================================================
// MAIN SCRIPT LOGIC - DO NOT EDIT BELOW THIS LINE
// =======================================================================

/**
 * Main function to orchestrate the fetching, analysis, and emailing.
 * This is the function that the trigger should run.
 */
function main() {
  const allMenus = {};

  Logger.log("Starting menu scraping process...");

  for (const restaurant in USER_CONFIG.restaurants) {
    if (USER_CONFIG.restaurants[restaurant]) {
      try {
        Logger.log(`Fetching menu for: ${restaurant}`);
        if (restaurant === "meal-swipe-exchange") {
          const foodTrucks = getFoodTruckMenu();
          if (Object.keys(foodTrucks).length > 0) {
             allMenus["Food Trucks"] = foodTrucks;
          }
        } else {
          const menu = getRestaurantMenu(restaurant);
          if (menu.length > 0) {
             allMenus[restaurant] = menu;
          }
        }
      } catch (e) {
        Logger.log(`Error fetching menu for ${restaurant}: ${e.message}`);
      }
    }
  }

  if (Object.keys(allMenus).length === 0) {
    Logger.log("No menus found for today. Exiting.");
    // Optionally send an email that no menus were available.
    // sendEmail("No UCLA Menus Available", "Could not retrieve any menus for today.");
    return;
  }
  
  Logger.log("Menus successfully scraped. Getting AI recommendations...");
  const summaryHtml = getAiRecommendations(allMenus);

  if (!summaryHtml) {
      Logger.log("Failed to get a summary from the AI. Exiting.");
      return;
  }
  
  Logger.log("Sending summary email...");
  sendEmail("Your UCLA Dining Recommendations for Today", summaryHtml);
  Logger.log("Process complete.");
}

/**
 * Scrapes the menu for a standard dining hall.
 * @param {string} restaurantSlug The URL slug for the restaurant.
 * @return {string[]} An array of menu items.
 */
function getRestaurantMenu(restaurantSlug) {
  const url = `https://dining.ucla.edu/${restaurantSlug}/`;
  const menuItems = [];

  try {
    const htmlContent = UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getContentText();
    const $ = Cheerio.load(htmlContent);

    // Food items are in <h3> tags within the <main> element
    const mainContent = $('main');
    if (mainContent.length) {
      mainContent.find('h3').each((i, el) => {
        const item = $(el).text().trim();
        if (item) {
          menuItems.push(item);
        }
      });
    }
    return menuItems;
  } catch (e) {
    Logger.log(`Failed to fetch or parse ${url}. Error: ${e.toString()}`);
    return [];
  }
}

/**
 * Scrapes the schedule for the meal-swipe-exchange food trucks.
 * @return {Object} An object with time slots as keys and truck names as values.
 */
function getFoodTruckMenu() {
  const url = 'https://dining.ucla.edu/meal-swipe-exchange/';
  const todayTrucks = {};
  
  try {
    const htmlContent = UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getContentText();
    const $ = Cheerio.load(htmlContent);

    // Get today's date in the format "Mon, June 23"
    const todayString = Utilities.formatDate(new Date(), "PST", "E, MMMM d");
    Logger.log(`Looking for food trucks for date: ${todayString}`);

    // The food trucks are in tables inside a specific div
    $('div.wp-container-core-columns-is-layout-67c09cde').find('table tbody tr').each((i, row) => {
        const dateCell = $(row).find('td:first-child, th:first-child').text().trim();
        
        // Check if the row's date matches today's date
        if (dateCell.includes(todayString)) {
            Logger.log(`Found matching date row: ${dateCell}`);
            const timeSlots = ['5 p.m. – 8:30 p.m.', '9 p.m. – 12 a.m.'];
            
            $(row).find('td').slice(1).each((j, cell) => {
                const truckName = $(cell).text().trim();
                if (truckName) {
                    todayTrucks[timeSlots[j]] = [truckName];
                }
            });
        }
    });
    return todayTrucks;
  } catch (e) {
    Logger.log(`Failed to fetch or parse food trucks page. Error: ${e.toString()}`);
    return {};
  }
}


/**
 * Calls the Gemini API to get food recommendations.
 * @param {Object} allMenus An object containing all scraped menu data.
 * @return {string|null} An HTML string for the email body, or null on failure.
 */
function getAiRecommendations(allMenus) {
  const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${USER_CONFIG.geminiApiKey}`;
  
  const prompt = `
    You are a friendly and helpful assistant for a UCLA student trying to decide where to eat today.
    
    Based on the following JSON object of today's menus and the user's stated preference, please generate a concise and easy-to-read email summary in HTML format.

    User Preference: "${USER_CONFIG.preferences}"

    Today's Menus:
    ${JSON.stringify(allMenus, null, 2)}

    Please structure your response as follows:
    1. Start with a friendly greeting and a brief summary of the best options for the day based on the user's preference.
    2. Create a section for each of the top 2-4 recommended locations.
    3. Under each location, use a list to highlight the specific dishes that match the preference.
    4. If there are no good matches, say so in a friendly way.
    5. Keep the entire summary brief and scannable. Do not include locations that are not relevant to the preference.
    
    Format the output as a clean, simple HTML string that can be directly embedded in an email. Do not include \`<html>\` or \`<body>\` tags. Use tags like <h4> for restaurant names and <ul>/<li> for menu items.
  `;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(API_ENDPOINT, options);
    const responseData = JSON.parse(response.getContentText());

    if (responseData && responseData.candidates && responseData.candidates[0].content.parts[0].text) {
      let htmlContent = responseData.candidates[0].content.parts[0].text;
      // Clean up potential markdown code fences
      htmlContent = htmlContent.replace(/```html/g, '').replace(/```/g, '');
      return htmlContent;
    } else {
      Logger.log("Gemini API Error: Invalid response format.");
      Logger.log(JSON.stringify(responseData, null, 2));
      return `<h3>Error</h3><p>Could not get recommendations from the AI. The API returned an unexpected response.</p><p>Response: ${JSON.stringify(responseData)}</p>`;
    }
  } catch(e) {
    Logger.log(`Gemini API Fetch Error: ${e.toString()}`);
    return `<h3>Error</h3><p>Could not connect to the AI service to get recommendations. Please check your API key and network settings.</p>`;
  }
}

/**
 * Sends an email with the given subject and HTML body.
 * @param {string} subject The subject of the email.
 * @param {string} htmlBody The HTML content of the email.
 */
function sendEmail(subject, htmlBody) {
  if (!USER_CONFIG.email || USER_CONFIG.email === "YOUR_EMAIL@example.com") {
      Logger.log("Email not sent: Please configure your email address in USER_CONFIG.");
      return;
  }
  
  MailApp.sendEmail({
    to: USER_CONFIG.email,
    subject: subject,
    htmlBody: htmlBody
  });
}
