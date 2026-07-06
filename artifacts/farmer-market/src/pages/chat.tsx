import { useState, useRef, useEffect } from "react";
import { useChatQuery, useGetChatHistory, ChatMessage } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Chat() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{role: string, content: string, id: number}>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: history, isLoading: isHistoryLoading } = useGetChatHistory({ limit: 20 });
  const chatMutation = useChatQuery();

  useEffect(() => {
    if (history && messages.length === 0) {
      setMessages(history.map(m => ({ role: m.role, content: m.content, id: m.id })));
    }
  }, [history]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || chatMutation.isPending) return;

    const newQuery = query;
    setQuery("");
    
    // Optimistically add user message
    const tempId = Date.now();
    setMessages(prev => [...prev, { role: "user", content: newQuery, id: tempId }]);

    chatMutation.mutate({
      data: { query: newQuery }
    }, {
      onSuccess: (res) => {
        setMessages(prev => [...prev, { role: "assistant", content: res.answer, id: Date.now() + 1 }]);
      },
      onError: () => {
        // Rollback on error or show error message
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error processing your request. Please try again.", id: Date.now() + 1 }]);
      }
    });
  };

  const starterQueries = [
    "What is the current MSP for Wheat in Punjab?",
    "Should I sell my Paddy now or wait for a week?",
    "Tell me about PM-KISAN eligibility.",
    "Are there any market crashes expected in Haryana?"
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          FarmSphere AI Assistant
        </h1>
        <p className="text-muted-foreground mt-1">Your 24/7 agricultural expert and market analyst.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-2">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-6"
        >
          {isHistoryLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-md mx-auto">
              <div className="bg-primary/10 p-6 rounded-full">
                <Bot className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">How can I help you today, Kisan bhai?</h3>
                <p className="text-muted-foreground">Ask me about current market prices, weather predictions, fairness of an offer, or government schemes.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {starterQueries.map((sq, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className="h-auto py-3 px-4 text-left justify-start whitespace-normal font-normal bg-card hover:border-primary"
                    onClick={() => {
                      setQuery(sq);
                    }}
                  >
                    {sq}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                    msg.role === 'user' 
                      ? 'bg-foreground text-background rounded-tr-sm' 
                      : 'bg-muted text-foreground border rounded-tl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {chatMutation.isPending && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="bg-muted text-foreground border rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-card mt-auto">
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 py-6 pl-5 pr-14 text-base rounded-full bg-background border-2 focus-visible:ring-0 focus-visible:border-primary"
              disabled={chatMutation.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-2 top-2 h-10 w-10 rounded-full" 
              disabled={!query.trim() || chatMutation.isPending}
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">AI can make mistakes. Always verify critical market data.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
