
// Background service worker for the Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Posts Scraper extension installed');
});

// Handle messages between content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Forward messages to popup if it's open
  if (request.action === 'updateProgress' || 
      request.action === 'scrapingComplete' || 
      request.action === 'scrapingError') {
    
    // Try to send to popup
    chrome.runtime.sendMessage(request).catch(() => {
      // Popup might not be open, that's okay
    });
  }
  
  sendResponse({ success: true });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open the popup (this is handled automatically by manifest)
});
