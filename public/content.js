
// Content script for LinkedIn saved posts page
let isScrapingActive = false;
let scrapedPosts = [];

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'startScraping') {
    startScraping(request.appUrl);
    sendResponse({ success: true });
  }
});

async function startScraping(appUrl) {
  if (isScrapingActive) return;
  
  isScrapingActive = true;
  scrapedPosts = [];
  
  try {
    // Inject the scraping script
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    (document.head || document.documentElement).appendChild(script);
    
    // Wait for the injected script to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start the actual scraping process
    await scrapeAllPosts(appUrl);
    
  } catch (error) {
    console.error('Scraping error:', error);
    chrome.runtime.sendMessage({
      action: 'scrapingError',
      error: error.message
    });
  } finally {
    isScrapingActive = false;
  }
}

async function scrapeAllPosts(appUrl) {
  let currentPage = 0;
  let hasMorePosts = true;
  
  while (hasMorePosts) {
    chrome.runtime.sendMessage({
      action: 'updateProgress',
      current: scrapedPosts.length,
      total: scrapedPosts.length + 10,
      message: 'Scraping posts...'
    });
    
    // Get posts from current view
    const postsOnPage = await scrapeCurrentPage();
    
    if (postsOnPage.length === 0) {
      hasMorePosts = false;
      break;
    }
    
    scrapedPosts.push(...postsOnPage);
    
    // Try to load more posts by scrolling
    const scrolled = await scrollToLoadMore();
    if (!scrolled) {
      hasMorePosts = false;
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
    currentPage++;
    
    // Safety limit
    if (currentPage > 50) break;
  }
  
  // Send posts to the main app
  if (scrapedPosts.length > 0) {
    await sendPostsToApp(scrapedPosts, appUrl);
  }
  
  chrome.runtime.sendMessage({
    action: 'scrapingComplete',
    count: scrapedPosts.length
  });
}

async function scrapeCurrentPage() {
  return new Promise((resolve) => {
    // Use the injected script to scrape posts
    window.postMessage({ type: 'SCRAPE_CURRENT_PAGE' }, '*');
    
    // Listen for response
    const messageListener = (event) => {
      if (event.source === window && event.data.type === 'SCRAPED_POSTS') {
        window.removeEventListener('message', messageListener);
        resolve(event.data.posts || []);
      }
    };
    
    window.addEventListener('message', messageListener);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      window.removeEventListener('message', messageListener);
      resolve([]);
    }, 10000);
  });
}

async function scrollToLoadMore() {
  const initialHeight = document.body.scrollHeight;
  
  // Scroll to bottom
  window.scrollTo(0, document.body.scrollHeight);
  
  // Wait for potential new content to load
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check if new content was loaded
  return document.body.scrollHeight > initialHeight;
}

async function sendPostsToApp(posts, appUrl) {
  try {
    // Create a temporary iframe to send data to the main app
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${appUrl}?extension=true`;
    document.body.appendChild(iframe);
    
    // Wait for iframe to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send posts via postMessage
    iframe.contentWindow.postMessage({
      type: 'LINKEDIN_POSTS_IMPORT',
      posts: posts
    }, appUrl);
    
    // Remove iframe after sending
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
    
  } catch (error) {
    console.error('Error sending posts to app:', error);
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(posts));
    alert(`Scraped ${posts.length} posts! Data copied to clipboard. Paste it in your app.`);
  }
}
