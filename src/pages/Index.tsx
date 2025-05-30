
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Linkedin, Database, MessageSquare, BarChart3 } from 'lucide-react';
import LinkedInAuth from '@/components/LinkedInAuth';
import ScrapingInterface from '@/components/ScrapingInterface';
import ChatInterface from '@/components/ChatInterface';
import PostsDisplay from '@/components/PostsDisplay';
import { LinkedInPost } from '@/types/linkedin';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [posts, setPosts] = useState<LinkedInPost[]>([]);

  useEffect(() => {
    // Check if user is already authenticated
    const sessionCookie = localStorage.getItem('linkedin_session');
    if (sessionCookie) {
      setIsAuthenticated(true);
    }

    // Load existing posts
    const savedPosts = localStorage.getItem('linkedin_posts');
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleScrapingComplete = (newPosts: LinkedInPost[]) => {
    setPosts(newPosts);
    localStorage.setItem('linkedin_posts', JSON.stringify(newPosts));
  };

  const handleLogout = () => {
    localStorage.removeItem('linkedin_session');
    localStorage.removeItem('linkedin_posts');
    setIsAuthenticated(false);
    setPosts([]);
  };

  if (!isAuthenticated) {
    return <LinkedInAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-linkedin-blue rounded-lg flex items-center justify-center mr-3">
                <Linkedin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LinkedIn Post AI</h1>
                <p className="text-sm text-gray-500">Your intelligent LinkedIn post assistant</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="scraping" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-1/2">
            <TabsTrigger value="scraping" className="flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Scraping
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Browse Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scraping" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Import Your LinkedIn Saved Posts
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Scrape your saved LinkedIn posts and unlock the power of AI-driven search and analysis.
                Find insights, patterns, and specific content with natural language queries.
              </p>
            </div>
            <ScrapingInterface 
              onScrapingComplete={handleScrapingComplete}
              existingPosts={posts}
            />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                AI-Powered Post Search
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Ask natural language questions about your saved posts. Find specific content,
                analyze trends, or discover insights you might have missed.
              </p>
            </div>
            {posts.length > 0 ? (
              <ChatInterface posts={posts} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  No posts available yet. Please scrape your LinkedIn posts first.
                </p>
                <button
                  onClick={() => document.querySelector('[value="scraping"]')?.click()}
                  className="text-linkedin-blue hover:text-linkedin-blue-dark underline"
                >
                  Go to Scraping →
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Browse Your Saved Posts
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                View, search, and sort through all your saved LinkedIn posts in a clean,
                organized interface with engagement metrics and easy access.
              </p>
            </div>
            <PostsDisplay posts={posts} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
