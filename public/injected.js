
// Injected script to access LinkedIn's internal data
(function() {
  'use strict';
  
  // Listen for scraping requests
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data.type === 'SCRAPE_CURRENT_PAGE') {
      const posts = scrapeLinkedInSavedPosts();
      window.postMessage({
        type: 'SCRAPED_POSTS',
        posts: posts
      }, '*');
    }
  });
  
  function scrapeLinkedInSavedPosts() {
    const posts = [];
    
    // Target the specific UL container for saved posts
    const postsContainer = document.querySelector('body > div.application-outlet > div.authentication-outlet > div > main > section > div > div.scaffold-finite-scroll__content > div > div:nth-child(4) > div > ul');
    
    if (!postsContainer) {
      console.log('Posts container not found');
      return posts;
    }
    
    // Get all LI elements (each represents a saved post)
    const postElements = postsContainer.querySelectorAll('li');
    console.log(`Found ${postElements.length} post elements`);
    
    postElements.forEach((element, index) => {
      try {
        const post = extractSavedPostData(element, index);
        if (post && post.content && post.content.trim().length > 0) {
          posts.push(post);
          console.log(`Extracted post ${index + 1}:`, post.content.substring(0, 100) + '...');
        }
      } catch (error) {
        console.error(`Error extracting post ${index + 1}:`, error);
      }
    });
    
    console.log(`Successfully extracted ${posts.length} posts`);
    return posts;
  }
  
  function extractSavedPostData(element, index) {
    // Extract post content using the specific selector pattern
    const contentSelectors = [
      'div > div > div > div.jeCfLSDsuYbeNAnkOXlHnSTZWpDQDAipHyVA.entity-result__content-inner-container--right-padding > div > p',
      'div > div > div > div.jeCfLSDsuYbeNAnkOXlHnSTZWpDQDAipHyVA.entity-result__content-inner-container--right-padding > div.linked-area.flex-1.cursor-pointer > p'
    ];
    
    let content = '';
    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector);
      if (contentElement) {
        content = (contentElement.textContent || contentElement.innerText || '').trim();
        if (content.length > 10) break; // Found substantial content
      }
    }
    
    if (!content) {
      console.log(`No content found for post ${index + 1}`);
      return null;
    }
    
    // Extract author information - look for author elements within the post
    const authorSelectors = [
      '.entity-result__title-text a',
      '.entity-result__primary-subtitle',
      '[data-anonymize="person-name"]',
      '.entity-result__content .entity-result__title-text'
    ];
    
    let authorName = `LinkedIn User ${index + 1}`;
    let authorUrl = '';
    
    for (const selector of authorSelectors) {
      const authorElement = element.querySelector(selector);
      if (authorElement) {
        if (authorElement.tagName === 'A') {
          authorName = (authorElement.textContent || authorElement.innerText || '').trim();
          authorUrl = authorElement.href || '';
        } else {
          authorName = (authorElement.textContent || authorElement.innerText || '').trim();
        }
        if (authorName && authorName !== `LinkedIn User ${index + 1}`) break;
      }
    }
    
    // Extract headline/subtitle
    const headlineElement = element.querySelector('.entity-result__primary-subtitle, .entity-result__secondary-subtitle');
    const headline = headlineElement ? 
      (headlineElement.textContent || headlineElement.innerText || '').trim() : 
      'LinkedIn User';
    
    // Try to extract any engagement metrics if available
    const likeElement = element.querySelector('[aria-label*="like"], [aria-label*="reaction"]');
    const likes = likeElement ? 
      parseInt(extractNumberFromText(likeElement.getAttribute('aria-label') || '0')) : 
      0;
    
    // Generate timestamps and URLs
    const timestamp = new Date().toISOString();
    const postUrl = `${window.location.origin}/saved-post-${Date.now()}-${index}`;
    const id = `saved-post-${Date.now()}-${index}`;
    
    return {
      id,
      author: {
        name: authorName,
        profileUrl: authorUrl,
        headline: headline
      },
      content,
      timestamp,
      likes,
      comments: 0,
      shares: 0,
      postUrl,
      savedAt: new Date().toISOString()
    };
  }
  
  function extractNumberFromText(text) {
    const match = text.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : 0;
  }
})();
