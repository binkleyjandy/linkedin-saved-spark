
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage, LinkedInPost } from '@/types/linkedin';

interface ChatInterfaceProps {
  posts: LinkedInPost[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ posts }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm here to help you search through your ${posts.length} saved LinkedIn posts. You can ask me things like:\n\n• "Show me posts about ROI at conferences"\n• "Find posts from last month about AI"\n• "What are the most engaging posts about leadership?"\n\nWhat would you like to explore?`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await simulateLLMResponse(inputMessage, posts);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        relatedPosts: response.relatedPosts
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateLLMResponse = async (query: string, posts: LinkedInPost[]): Promise<{
    content: string;
    relatedPosts?: LinkedInPost[];
  }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerQuery = query.toLowerCase();
    let relevantPosts: LinkedInPost[] = [];

    // Simple keyword matching simulation
    if (lowerQuery.includes('roi') || lowerQuery.includes('conference')) {
      relevantPosts = posts.filter(post => 
        post.content.toLowerCase().includes('roi') || 
        post.content.toLowerCase().includes('conference')
      ).slice(0, 3);
    } else if (lowerQuery.includes('ai') || lowerQuery.includes('machine learning')) {
      relevantPosts = posts.filter(post => 
        post.content.toLowerCase().includes('ai') || 
        post.content.toLowerCase().includes('machine learning')
      ).slice(0, 3);
    } else if (lowerQuery.includes('leadership') || lowerQuery.includes('management')) {
      relevantPosts = posts.filter(post => 
        post.content.toLowerCase().includes('leadership') || 
        post.content.toLowerCase().includes('management')
      ).slice(0, 3);
    } else {
      // Generic search - return most recent posts
      relevantPosts = posts
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3);
    }

    let responseContent = '';
    
    if (relevantPosts.length > 0) {
      responseContent = `I found ${relevantPosts.length} posts that match your query. Here are the most relevant ones:\n\n`;
      
      relevantPosts.forEach((post, index) => {
        responseContent += `**${index + 1}. ${post.author.name}**\n`;
        responseContent += `${post.content.substring(0, 150)}...\n`;
        responseContent += `👍 ${post.likes} likes • 💬 ${post.comments} comments • 📅 ${new Date(post.timestamp).toLocaleDateString()}\n\n`;
      });
    } else {
      responseContent = "I couldn't find any posts that directly match your query. Try rephrasing your search or asking about different topics like 'AI', 'leadership', 'conferences', or 'ROI'.";
    }

    return {
      content: responseContent,
      relatedPosts: relevantPosts.length > 0 ? relevantPosts : undefined
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardContent className="flex-1 flex flex-col p-4">
        <div className="flex items-center mb-4 pb-3 border-b">
          <div className="w-8 h-8 bg-linkedin-blue rounded-full flex items-center justify-center mr-3">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Search Assistant</h3>
            <p className="text-sm text-gray-500">Ask me anything about your saved posts</p>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-linkedin-blue text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start">
                    {message.role === 'assistant' && (
                      <Bot className="w-4 h-4 mr-2 mt-0.5 text-linkedin-blue" />
                    )}
                    {message.role === 'user' && (
                      <User className="w-4 h-4 mr-2 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.relatedPosts && (
                        <div className="mt-3 space-y-2">
                          {message.relatedPosts.map((post, index) => (
                            <div key={post.id} className="bg-white p-3 rounded border text-gray-900 text-xs">
                              <div className="flex items-center mb-2">
                                <div className="w-6 h-6 bg-gray-300 rounded-full mr-2"></div>
                                <span className="font-medium">{post.author.name}</span>
                              </div>
                              <p className="mb-2">{post.content.substring(0, 100)}...</p>
                              <div className="flex items-center text-gray-500 space-x-3">
                                <span>👍 {post.likes}</span>
                                <span>💬 {post.comments}</span>
                                <span>📅 {new Date(post.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center">
                    <Bot className="w-4 h-4 mr-2 text-linkedin-blue" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center space-x-2 mt-4 pt-3 border-t">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your saved posts..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            size="sm"
            className="bg-linkedin-blue hover:bg-linkedin-blue-dark"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
