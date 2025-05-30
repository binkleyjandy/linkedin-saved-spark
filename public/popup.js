
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

    // Save the app URL
    chrome.storage.sync.set({ appUrl: appUrl });

    try {
      // Check if we're on the right LinkedIn page
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('linkedin.com/my-items/saved-posts')) {
        updateStatus('Please navigate to LinkedIn saved posts first', 'error');
        return;
      }

      updateStatus('Starting scraping process...', 'info');
      scrapeBtn.disabled = true;
      progress.style.display = 'block';

      // Start the scraping process
      chrome.tabs.sendMessage(tab.id, { 
        action: 'startScraping',
        appUrl: appUrl
      });

    } catch (error) {
      updateStatus('Error: ' + error.message, 'error');
      scrapeBtn.disabled = false;
      progress.style.display = 'none';
    }
  });

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateProgress') {
      updateProgress(request.current, request.total, request.message);
    } else if (request.action === 'scrapingComplete') {
      updateStatus(`Successfully scraped ${request.count} posts!`, 'success');
      scrapeBtn.disabled = false;
      progress.style.display = 'none';
    } else if (request.action === 'scrapingError') {
      updateStatus('Error: ' + request.error, 'error');
      scrapeBtn.disabled = false;
      progress.style.display = 'none';
    }
  });

  function updateStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
  }

  function updateProgress(current, total, message) {
    const percentage = (current / total) * 100;
    progressFill.style.width = percentage + '%';
    progressText.textContent = `${message} (${current}/${total})`;
  }
});
