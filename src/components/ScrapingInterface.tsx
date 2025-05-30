
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Play, Pause, RotateCcw, Database } from 'lucide-react';
import { ScrapingStatus, LinkedInPost } from '@/types/linkedin';

interface ScrapingInterfaceProps {
  onScrapingComplete: (posts: LinkedInPost[]) => void;
  existingPosts: LinkedInPost[];
}

const ScrapingInterface: React.FC<ScrapingInterfaceProps> = ({ 
  onScrapingComplete, 
  existingPosts 
}) => {
  const [status, setStatus] = useState<ScrapingStatus>({
    isScrapingActive: false,
    progress: 0,
    totalPosts: 0,
    currentPost: 0
  });

  const startScraping = async () => {
    setStatus({
      isScrapingActive: true,
      progress: 0,
      totalPosts: 100, // Estimated
      currentPost: 0
    });

    try {
      const posts = await simulateLinkedInScraping();
      onScrapingComplete(posts);
      
      setStatus(prev => ({
        ...prev,
        isScrapingActive: false,
        progress: 100,
        currentPost: prev.totalPosts
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isScrapingActive: false,
        error: 'Failed to scrape posts. Please try again.'
      }));
    }
  };

  const simulateLinkedInScraping = async (): Promise<LinkedInPost[]> => {
    const mockPosts: LinkedInPost[] = [];
    const totalPosts = 50;

    for (let i = 0; i < totalPosts; i++) {
      // Simulate scraping delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const post: LinkedInPost = {
        id: `post-${i + 1}`,
        author: {
          name: `Professional ${i + 1}`,
          profileUrl: `https://linkedin.com/in/professional-${i + 1}`,
          imageUrl: `https://images.unsplash.com/photo-${1500000000000 + i}?w=40&h=40&fit=crop&crop=face`,
          headline: 'Senior Software Engineer at Tech Corp'
        },
        content: `This is a sample LinkedIn post about ${getRandomTopic()}. ${generateMockContent()}`,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        likes: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 50),
        shares: Math.floor(Math.random() * 20),
        postUrl: `https://linkedin.com/posts/activity-${i + 1}`,
        savedAt: new Date().toISOString()
      };

      mockPosts.push(post);
      
      setStatus(prev => ({
        ...prev,
        progress: ((i + 1) / totalPosts) * 100,
        currentPost: i + 1,
        totalPosts
      }));
    }

    return mockPosts;
  };

  const getRandomTopic = () => {
    const topics = [
      'ROI at conferences',
      'machine learning trends',
      'startup funding',
      'remote work productivity',
      'AI development',
      'career growth',
      'leadership skills',
      'tech innovation',
      'data science',
      'product management'
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  };

  const generateMockContent = () => {
    const contents = [
      'Great insights on how to measure success and demonstrate value in professional settings.',
      'I found this approach really effective for tracking performance metrics.',
      'This strategy has helped our team achieve better results consistently.',
      'Sharing some lessons learned from recent projects and implementations.',
      'Key takeaways from industry experts on best practices and methodologies.'
    ];
    return contents[Math.floor(Math.random() * contents.length)];
  };

  const clearData = () => {
    localStorage.removeItem('linkedin_posts');
    onScrapingComplete([]);
    setStatus({
      isScrapingActive: false,
      progress: 0,
      totalPosts: 0,
      currentPost: 0
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="w-5 h-5 mr-2 text-linkedin-blue" />
          Scrape LinkedIn Posts
        </CardTitle>
        <CardDescription>
          Import your saved LinkedIn posts for AI-powered search and analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {existingPosts.length > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Currently storing {existingPosts.length} posts. Last updated: {
                new Date(existingPosts[0]?.savedAt || '').toLocaleDateString()
              }
            </AlertDescription>
          </Alert>
        )}

        {status.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {status.error}
            </AlertDescription>
          </Alert>
        )}

        {status.isScrapingActive && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Scraping posts...</span>
              <span>{status.currentPost} / {status.totalPosts}</span>
            </div>
            <Progress value={status.progress} className="h-2" />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={startScraping}
            disabled={status.isScrapingActive}
            className="bg-linkedin-blue hover:bg-linkedin-blue-dark"
          >
            {status.isScrapingActive ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Scraping...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Scraping
              </>
            )}
          </Button>

          {existingPosts.length > 0 && (
            <Button
              onClick={clearData}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Data
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScrapingInterface;
