
document.addEventListener('DOMContentLoaded', function() {
  const scrapeBtn = document.getElementById('scrapeBtn');
  const openLinkedInBtn = document.getElementById('openLinkedIn');
  const status = document.getElementById('status');
  const progress = document.getElementById('progress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const appUrlInput = document.getElementById('appUrl');

  // Load saved app URL
  chrome.storage.sync.get(['appUrl'], function(result) {
    if (result.appUrl) {
      appUrlInput.value = result.appUrl;
    } else {
      appUrlInput.value = 'http://localhost:5173';
    }
  });

  // Save app URL when changed
  appUrlInput.addEventListener('change', function() {
    chrome.storage.sync.set({ appUrl: appUrlInput.value });
  });

  openLinkedInBtn.addEventListener('click', function() {
    chrome.tabs.create({
      url: 'https://www.linkedin.com/my-items/saved-posts/'
    });
  });

  scrapeBtn.addEventListener('click', async function() {
    const appUrl = appUrlInput.value.trim();
    if (!appUrl) {
      updateStatus('Please enter your app URL', 'error');
      return;
    }

    // Validate URL format
    try {
      new URL(appUrl);
    } catch (e) {
      updateStatus('Please enter a valid URL (e.g., http://localhost:5173)', 'error');
      return;
    }

    // Save the app URL
    chrome.storage.sync.set({ appUrl: appUrl });

    try {
      // Check if we're on the right LinkedIn page
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('linkedin.com/my-items/saved-posts')) {
        updateStatus('Please navigate to LinkedIn saved posts page first. Click "Open LinkedIn Saved Posts" button.', 'error');
        return;
      }

      updateStatus('Starting scraping process...', 'info');
      scrapeBtn.disabled = true;
      progress.style.display = 'block';

      // Send message to content script to start scraping
      chrome.tabs.sendMessage(tab.id, { 
        action: 'startScraping',
        appUrl: appUrl
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Content script error:', chrome.runtime.lastError);
          updateStatus('Error: Make sure you are on the LinkedIn saved posts page and refresh the page.', 'error');
          scrapeBtn.disabled = false;
          progress.style.display = 'none';
        } else if (response && response.success) {
          updateStatus('Scraping started successfully...', 'info');
        }
      });

    } catch (error) {
      console.error('Extension error:', error);
      updateStatus('Error: ' + error.message, 'error');
      scrapeBtn.disabled = false;
      progress.style.display = 'none';
    }
  });

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Popup received message:', request);
    
    if (request.action === 'updateProgress') {
      updateProgress(request.current, request.total, request.message);
    } else if (request.action === 'scrapingComplete') {
      updateStatus(`Successfully scraped ${request.count} posts and sent to your app!`, 'success');
      scrapeBtn.disabled = false;
      progress.style.display = 'none';
    } else if (request.action === 'scrapingError') {
      updateStatus('Error: ' + request.error, 'error');
      scrapeBtn.disabled = false;
      progress.style.display = 'none';
    } else if (request.action === 'connectionSuccess') {
      updateStatus('Connected to app successfully! Continuing to scrape...', 'info');
    }
  });

  function updateStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    console.log('Status update:', message, type);
  }

  function updateProgress(current, total, message) {
    const percentage = Math.min((current / total) * 100, 100);
    progressFill.style.width = percentage + '%';
    progressText.textContent = `${message} (${current}/${total})`;
    console.log('Progress update:', current, total, message);
  }
});
