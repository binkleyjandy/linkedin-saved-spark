
// Content script for LinkedIn saved posts page
let isScrapingActive = false;
let scrapedPosts = [];

console.log('LinkedIn Posts Scraper content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Content script received message:', request);
  
  if (request.action === 'startScraping') {
    if (isScrapingActive) {
      sendResponse({ success: false, error: 'Scraping already in progress' });
      return;
    }
    
    startScraping(request.appUrl)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Scraping failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Will respond asynchronously
  }
});

async function startScraping(appUrl) {
  if (isScrapingActive) return;
  
  console.log('Starting scraping process with app URL:', appUrl);
  isScrapingActive = true;
  scrapedPosts = [];
  
  try {
    // Inject the scraping script
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = () => console.log('Injected script loaded successfully');
    script.onerror = (error) => console.error('Failed to load injected script:', error);
    (document.head || document.documentElement).appendChild(script);
    
    // Wait for the injected script to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
  let consecutiveEmptyPages = 0;
  const MAX_POSTS = 25;
  
  console.log('Starting to scrape all posts (max 25)');
  
  while (hasMorePosts && consecutiveEmptyPages < 3 && scrapedPosts.length < MAX_POSTS) {
    chrome.runtime.sendMessage({
      action: 'updateProgress',
      current: scrapedPosts.length,
      total: Math.min(scrapedPosts.length + 10, MAX_POSTS),
      message: 'Scraping posts...'
    });
    
    // Get posts from current view
    const postsOnPage = await scrapeCurrentPage();
    console.log(`Page ${currentPage + 1}: Found ${postsOnPage.length} posts`);
    
    if (postsOnPage.length === 0) {
      consecutiveEmptyPages++;
      console.log(`Empty page ${consecutiveEmptyPages}/3`);
    } else {
      consecutiveEmptyPages = 0;
      // Only add posts up to the limit
      const remainingSlots = MAX_POSTS - scrapedPosts.length;
      const postsToAdd = postsOnPage.slice(0, remainingSlots);
      scrapedPosts.push(...postsToAdd);
      console.log(`Total posts scraped: ${scrapedPosts.length}/${MAX_POSTS}`);
      
      // Stop if we've reached the limit
      if (scrapedPosts.length >= MAX_POSTS) {
        console.log('Reached maximum post limit (25), stopping scrape');
        break;
      }
    }
    
    // Try to load more posts by scrolling
    const scrolled = await scrollToLoadMore();
    if (!scrolled && postsOnPage.length === 0) {
      hasMorePosts = false;
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
    currentPage++;
    
    // Safety limit
    if (currentPage > 20) {
      console.log('Reached page limit, stopping');
      break;
    }
  }
  
  console.log(`Scraping complete. Total posts: ${scrapedPosts.length}/${MAX_POSTS}`);
  
  // Send posts to the main app
  if (scrapedPosts.length > 0) {
    await sendPostsToApp(scrapedPosts, appUrl);
  } else {
    chrome.runtime.sendMessage({
      action: 'scrapingError',
      error: 'No posts found. Make sure you have saved posts on LinkedIn.'
    });
  }
}

async function scrapeCurrentPage() {
  return new Promise((resolve) => {
    console.log('Scraping current page...');
    
    // Use the injected script to scrape posts
    window.postMessage({ type: 'SCRAPE_CURRENT_PAGE' }, '*');
    
    // Listen for response
    const messageListener = (event) => {
      if (event.source === window && event.data.type === 'SCRAPED_POSTS') {
        window.removeEventListener('message', messageListener);
        console.log('Received scraped posts:', event.data.posts?.length || 0);
        resolve(event.data.posts || []);
      }
    };
    
    window.addEventListener('message', messageListener);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      window.removeEventListener('message', messageListener);
      console.log('Scraping timeout, returning empty array');
      resolve([]);
    }, 10000);
  });
}

async function scrollToLoadMore() {
  const initialHeight = document.body.scrollHeight;
  console.log('Scrolling to load more content...');
  
  // Scroll to bottom
  window.scrollTo(0, document.body.scrollHeight);
  
  // Wait for potential new content to load
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check if new content was loaded
  const newHeight = document.body.scrollHeight;
  const scrolled = newHeight > initialHeight;
  console.log(`Scroll result: ${initialHeight} -> ${newHeight} (${scrolled ? 'new content' : 'no new content'})`);
  
  return scrolled;
}

async function sendPostsToApp(posts, appUrl) {
  console.log(`Sending ${posts.length} posts to app at ${appUrl}`);
  
  try {
    // Create a temporary iframe to send data to the main app
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${appUrl}?extension=true`;
    document.body.appendChild(iframe);
    
    console.log('Created iframe, waiting for load...');
    
    // Wait for iframe to load
    await new Promise((resolve, reject) => {
      iframe.onload = () => {
        console.log('Iframe loaded successfully');
        resolve();
      };
      iframe.onerror = (error) => {
        console.error('Iframe failed to load:', error);
        reject(new Error('Failed to connect to your app. Make sure it is running at ' + appUrl));
      };
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Connection timeout. Make sure your app is running at ' + appUrl));
      }, 10000);
    });
    
    // Send posts via postMessage
    console.log('Sending posts via postMessage...');
    iframe.contentWindow.postMessage({
      type: 'LINKEDIN_POSTS_IMPORT',
      posts: posts
    }, appUrl);
    
    // Notify success
    chrome.runtime.sendMessage({
      action: 'connectionSuccess'
    });
    
    chrome.runtime.sendMessage({
      action: 'scrapingComplete',
      count: posts.length
    });
    
    // Remove iframe after sending
    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error sending posts to app:', error);
    
    // Fallback: copy to clipboard and show alert
    try {
      await navigator.clipboard.writeText(JSON.stringify(posts, null, 2));
      alert(`Could not connect to your app at ${appUrl}.\n\nScraped ${posts.length} posts and copied them to your clipboard.\n\nMake sure your app is running and paste the data manually.`);
      
      chrome.runtime.sendMessage({
        action: 'scrapingError',
        error: `Connection failed. Data copied to clipboard. Make sure your app is running at ${appUrl}`
      });
    } catch (clipboardError) {
      console.error('Clipboard fallback failed:', clipboardError);
      chrome.runtime.sendMessage({
        action: 'scrapingError',
        error: `Could not connect to app or copy to clipboard. Make sure your app is running at ${appUrl}`
      });
    }
  }
}
