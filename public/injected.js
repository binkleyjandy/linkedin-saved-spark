
// Injected script to access LinkedIn's internal data
(function() {
  'use strict';
  
  // Listen for scraping requests
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data.type === 'SCRAPE_CURRENT_PAGE') {
      const posts = scrapeLinkedInPosts();
      window.postMessage({
        type: 'SCRAPED_POSTS',
        posts: posts
      }, '*');
    }
  });
  
  function scrapeLinkedInPosts() {
    const posts = [];
    
    // LinkedIn saved posts are typically in articles or post containers
    const postSelectors = [
      '[data-urn*="urn:li:activity"]',
      '.feed-shared-update-v2',
      '.occludable-update',
      'article[data-urn]',
      '.feed-shared-update-v2__description-wrapper'
    ];
    
    let postElements = [];
    
    // Try different selectors to find posts
    for (const selector of postSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        postElements = Array.from(elements);
        break;
      }
    }
    
    postElements.forEach((element, index) => {
      try {
        const post = extractPostData(element, index);
        if (post && post.content) {
          posts.push(post);
        }
      } catch (error) {
        console.error('Error extracting post:', error);
      }
    });
    
    return posts;
  }
  
  function extractPostData(element, index) {
    // Extract author information
    const authorElement = element.querySelector('[data-urn*="urn:li:member"] a, .feed-shared-actor__name a, .update-components-actor__name a');
    const authorName = authorElement ? 
      (authorElement.textContent || authorElement.innerText || '').trim() : 
      `LinkedIn User ${index + 1}`;
    
    const authorUrl = authorElement ? 
      authorElement.href || '' : 
      '';
    
    // Extract author headline
    const headlineElement = element.querySelector('.feed-shared-actor__description, .update-components-actor__description');
    const headline = headlineElement ? 
      (headlineElement.textContent || headlineElement.innerText || '').trim() : 
      '';
    
    // Extract post content
    const contentSelectors = [
      '.feed-shared-update-v2__description',
      '.feed-shared-text',
      '.update-components-text',
      '[data-urn] .break-words',
      '.feed-shared-inline-show-more-text'
    ];
    
    let content = '';
    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector);
      if (contentElement) {
        content = (contentElement.textContent || contentElement.innerText || '').trim();
        if (content.length > 10) break; // Found substantial content
      }
    }
    
    // Extract engagement metrics
    const likeElement = element.querySelector('[aria-label*="like"], [aria-label*="reaction"], .social-counts-reactions__count');
    const likes = likeElement ? 
      parseInt(extractNumberFromText(likeElement.textContent || likeElement.getAttribute('aria-label') || '0')) : 
      0;
    
    const commentElement = element.querySelector('[aria-label*="comment"], .social-counts-comments__count');
    const comments = commentElement ? 
      parseInt(extractNumberFromText(commentElement.textContent || commentElement.getAttribute('aria-label') || '0')) : 
      0;
    
    const shareElement = element.querySelector('[aria-label*="share"], [aria-label*="repost"], .social-counts-shares__count');
    const shares = shareElement ? 
      parseInt(extractNumberFromText(shareElement.textContent || shareElement.getAttribute('aria-label') || '0')) : 
      0;
    
    // Extract timestamp
    const timeElement = element.querySelector('time, [data-urn] .update-components-actor__sub-description, .feed-shared-actor__sub-description');
    let timestamp = new Date().toISOString();
    
    if (timeElement) {
      const dateTime = timeElement.getAttribute('datetime') || timeElement.textContent || timeElement.innerText;
      if (dateTime) {
        const parsedDate = parseLinkedInDate(dateTime);
        if (parsedDate) {
          timestamp = parsedDate.toISOString();
        }
      }
    }
    
    // Extract post URL
    const postUrlElement = element.querySelector('a[href*="/posts/"], a[href*="/feed/update/"]');
    const postUrl = postUrlElement ? 
      new URL(postUrlElement.href, window.location.origin).href : 
      `${window.location.origin}/posts/activity-${Date.now()}-${index}`;
    
    // Generate unique ID
    const id = `post-${Date.now()}-${index}`;
    
    return {
      id,
      author: {
        name: authorName,
        profileUrl: authorUrl,
        headline: headline || 'LinkedIn User'
      },
      content,
      timestamp,
      likes,
      comments,
      shares,
      postUrl,
      savedAt: new Date().toISOString()
    };
  }
  
  function extractNumberFromText(text) {
    const match = text.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : 0;
  }
  
  function parseLinkedInDate(dateText) {
    // Handle various LinkedIn date formats
    const cleanText = dateText.trim().toLowerCase();
    
    // Handle relative dates
    if (cleanText.includes('now') || cleanText.includes('just now')) {
      return new Date();
    }
    
    if (cleanText.includes('minute')) {
      const minutes = parseInt(cleanText) || 1;
      return new Date(Date.now() - minutes * 60 * 1000);
    }
    
    if (cleanText.includes('hour')) {
      const hours = parseInt(cleanText) || 1;
      return new Date(Date.now() - hours * 60 * 60 * 1000);
    }
    
    if (cleanText.includes('day')) {
      const days = parseInt(cleanText) || 1;
      return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }
    
    if (cleanText.includes('week')) {
      const weeks = parseInt(cleanText) || 1;
      return new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);
    }
    
    if (cleanText.includes('month')) {
      const months = parseInt(cleanText) || 1;
      return new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);
    }
    
    // Try to parse as actual date
    try {
      return new Date(dateText);
    } catch (error) {
      return new Date();
    }
  }
})();
