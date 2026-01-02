import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Linkedin, 
  Users, 
  MessageSquare, 
  Share, 
  TrendingUp, 
  Search, 
  Send,
  Eye,
  ThumbsUp,
  BarChart3,
  UserPlus,
  Building,
  Globe,
  Calendar,
  Target,
  Network
} from "lucide-react";

export default function LinkedIn() {
  const { toast } = useToast();
  const [postContent, setPostContent] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [postLinkUrl, setPostLinkUrl] = useState("");
  const [postLinkTitle, setPostLinkTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    title: "",
    company: "",
    location: "",
    industry: ""
  });
  const [messageContent, setMessageContent] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");

  const { data: linkedinAccount } = useQuery({
    queryKey: ['/api/linkedin/profile'],
    retry: false,
  });

  const { data: connections } = useQuery({
    queryKey: ['/api/linkedin/connections'],
    enabled: !!linkedinAccount,
    retry: false,
  });

  const { data: trendingContent } = useQuery({
    queryKey: ['/api/linkedin/trending'],
    enabled: !!linkedinAccount,
    retry: false,
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/linkedin/analytics'],
    enabled: !!linkedinAccount,
    retry: false,
  });

  const connectLinkedInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/linkedin/auth');
      return await response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Connection Failed",
        description: "Failed to connect LinkedIn account.",
        variant: "destructive",
      });
    },
  });

  const publishPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await apiRequest('POST', '/api/linkedin/publish', postData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Published!",
        description: "Your LinkedIn post has been published successfully.",
      });
      setPostContent("");
      setPostImageUrl("");
      setPostLinkUrl("");
      setPostLinkTitle("");
      queryClient.invalidateQueries({ queryKey: ['/api/linkedin/analytics'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please reconnect your LinkedIn account.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Publish Failed",
        description: "Failed to publish LinkedIn post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const searchPeopleMutation = useMutation({
    mutationFn: async (query: any) => {
      const response = await apiRequest('POST', '/api/linkedin/search-people', query);
      return await response.json();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please reconnect your LinkedIn account.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Search Failed",
        description: "Failed to search LinkedIn profiles.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await apiRequest('POST', '/api/linkedin/send-message', messageData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Your LinkedIn message has been sent successfully.",
      });
      setMessageContent("");
      setMessageSubject("");
      setSelectedRecipient("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please reconnect your LinkedIn account.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Send Failed",
        description: "Failed to send LinkedIn message.",
        variant: "destructive",
      });
    },
  });

  const handlePublishPost = () => {
    if (!postContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter content for your LinkedIn post.",
        variant: "destructive",
      });
      return;
    }

    publishPostMutation.mutate({
      text: postContent,
      imageUrl: postImageUrl || undefined,
      linkUrl: postLinkUrl || undefined,
      linkTitle: postLinkTitle || undefined,
    });
  };

  const handleSearchPeople = () => {
    if (!searchQuery.trim() && !searchFilters.title && !searchFilters.company) {
      toast({
        title: "Search Query Required",
        description: "Please enter search keywords or filters.",
        variant: "destructive",
      });
      return;
    }

    searchPeopleMutation.mutate({
      keywords: searchQuery,
      ...searchFilters
    });
  };

  const handleSendMessage = () => {
    if (!selectedRecipient || !messageContent.trim()) {
      toast({
        title: "Message Details Required",
        description: "Please select a recipient and enter message content.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      recipientId: selectedRecipient,
      message: messageContent,
      subject: messageSubject || undefined
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
          LinkedIn Integration
        </h1>
        <p className="text-gray-600 text-lg">Professional networking and content publishing</p>
      </div>

      {!linkedinAccount ? (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center text-blue-900">
              <Linkedin className="w-8 h-8 mr-3 text-blue-600" />
              Connect Your LinkedIn Account
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Connect your LinkedIn account to publish posts, manage connections, and track analytics.
            </p>
            <Button
              onClick={() => connectLinkedInMutation.mutate()}
              disabled={connectLinkedInMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {connectLinkedInMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Linkedin className="w-4 h-4" />
                  <span>Connect LinkedIn</span>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Account Overview */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Linkedin className="w-6 h-6 mr-2 text-blue-600" />
                LinkedIn Account Connected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                {linkedinAccount.profilePicture && (
                  <img
                    src={linkedinAccount.profilePicture}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-lg text-gray-900">{linkedinAccount.name}</p>
                  <p className="text-gray-600">{linkedinAccount.headline}</p>
                  <Badge className="bg-blue-100 text-blue-800 mt-1">
                    {connections?.total || 0} connections
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Overview */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Profile Views</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatNumber(analytics.profileViews || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Post Impressions</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatNumber(analytics.postImpressions || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <ThumbsUp className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                      <p className="text-xl font-bold text-gray-900">
                        {(analytics.engagementRate || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Network className="w-6 h-6 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">New Connections</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatNumber(analytics.newConnections || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Features Tabs */}
          <Tabs defaultValue="publish" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="publish" className="flex items-center space-x-1">
                <Send className="w-4 h-4" />
                <span>Publish</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Network</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center space-x-1">
                <Search className="w-4 h-4" />
                <span>Search</span>
              </TabsTrigger>
              <TabsTrigger value="messaging" className="flex items-center space-x-1">
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-1">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="publish" className="space-y-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-900">
                    <Send className="w-5 h-5 mr-2 text-blue-600" />
                    Publish LinkedIn Post
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Post Content</label>
                    <Textarea
                      placeholder="What's on your mind? Share your professional insights..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      rows={6}
                      className="border-blue-200 focus:border-blue-400"
                    />
                    <p className="text-xs text-gray-500">{postContent.length}/3000 characters</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Image URL (Optional)</label>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={postImageUrl}
                        onChange={(e) => setPostImageUrl(e.target.value)}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Link URL (Optional)</label>
                      <Input
                        placeholder="https://example.com/article"
                        value={postLinkUrl}
                        onChange={(e) => setPostLinkUrl(e.target.value)}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                  </div>

                  {postLinkUrl && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Link Title</label>
                      <Input
                        placeholder="Article or link title"
                        value={postLinkTitle}
                        onChange={(e) => setPostLinkTitle(e.target.value)}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handlePublishPost}
                    disabled={publishPostMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {publishPostMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Publishing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Send className="w-4 h-4" />
                        <span>Publish Post</span>
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="space-y-6">
              <Card className="border border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-900">
                    <Users className="w-5 h-5 mr-2 text-green-600" />
                    Your Network ({connections?.total || 0} connections)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {connections?.connections?.slice(0, 10).map((connection: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{connection.name}</p>
                            <p className="text-sm text-gray-600">{connection.headline}</p>
                            {connection.location && (
                              <p className="text-xs text-gray-500">{connection.location}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRecipient(connection.id)}
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    ))}
                    
                    {(!connections?.connections || connections.connections.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No connections found</p>
                        <p className="text-sm">Start building your professional network</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-900">
                    <Search className="w-5 h-5 mr-2 text-purple-600" />
                    Search LinkedIn Professionals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Keywords</label>
                    <Input
                      placeholder="e.g., software engineer, marketing manager"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Job Title</label>
                      <Input
                        placeholder="e.g., CEO, Developer"
                        value={searchFilters.title}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, title: e.target.value }))}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Company</label>
                      <Input
                        placeholder="e.g., Google, Microsoft"
                        value={searchFilters.company}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, company: e.target.value }))}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Location</label>
                      <Input
                        placeholder="e.g., San Francisco, New York"
                        value={searchFilters.location}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Industry</label>
                      <Input
                        placeholder="e.g., Technology, Healthcare"
                        value={searchFilters.industry}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, industry: e.target.value }))}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSearchPeople}
                    disabled={searchPeopleMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {searchPeopleMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Searching...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4" />
                        <span>Search Professionals</span>
                      </div>
                    )}
                  </Button>

                  {searchPeopleMutation.data && (
                    <div className="space-y-3 mt-6">
                      <p className="font-medium text-gray-900">
                        Search Results ({searchPeopleMutation.data.total} found)
                      </p>
                      {searchPeopleMutation.data.people.map((person: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {person.pictureUrl ? (
                              <img
                                src={person.pictureUrl}
                                alt={person.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{person.name}</p>
                              <p className="text-sm text-gray-600">{person.headline}</p>
                              {person.location && (
                                <p className="text-xs text-gray-500">{person.location}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(person.profileUrl, '_blank')}
                              className="border-purple-300 text-purple-700 hover:bg-purple-100"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRecipient(person.id);
                                // Switch to messaging tab
                              }}
                              className="border-purple-300 text-purple-700 hover:bg-purple-100"
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Connect
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messaging" className="space-y-6">
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-900">
                    <MessageSquare className="w-5 h-5 mr-2 text-orange-600" />
                    Send LinkedIn Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Recipient</label>
                    <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                      <SelectTrigger className="border-orange-200">
                        <SelectValue placeholder="Select a connection" />
                      </SelectTrigger>
                      <SelectContent>
                        {connections?.connections?.map((connection: any) => (
                          <SelectItem key={connection.id} value={connection.id}>
                            {connection.name} - {connection.headline}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Subject (Optional)</label>
                    <Input
                      placeholder="Message subject"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <Textarea
                      placeholder="Write your professional message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={6}
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>

                  <Button
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {sendMessageMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>Send Message</span>
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    LinkedIn Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Detailed analytics coming soon</p>
                    <p className="text-sm">Connect your LinkedIn account to see performance metrics</p>
                  </div>
                </CardContent>
              </Card>

              {/* Trending Content */}
              {trendingContent && trendingContent.length > 0 && (
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                      Trending LinkedIn Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trendingContent.slice(0, 5).map((post: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900">{post.author}</p>
                            <Badge className="bg-green-100 text-green-800">
                              {post.likes} likes
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(post.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}