import { useEffect, useRef, useState } from 'react';
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/config";

export const useWebSocket = (
  url?: string,
  options?: { retryDelay?: number },
) => {
  const retryDelay = options?.retryDelay ?? 3000;
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!getBackendUrl()) {
      // Simulate websocket messages for demo
      const interval = setInterval(() => {
        const mockMessage = `2020-01-01 superduperlog`;
        setMessages(prev => [...prev.slice(-99), mockMessage]);
      }, 3000);

      return () => clearInterval(interval);
    }

    const websocketUrl = url || getBackendUrl().replace(/^https?:/, 'ws:').replace(/\/+$/, '') + '/ws';

    const connect = () => {
      try {
        console.log(`Connecting to: ${websocketUrl}`)
        ws.current = new WebSocket(websocketUrl);
        
        ws.current.onopen = () => {
          setConnected(true);
        };
        
        ws.current.onmessage = (event: MessageEvent) => {
          try {
            const message: string = event.data;
            setMessages(prev => [...prev.slice(-99), message]);
          } catch (error) {
            toast.error('Error parsing WebSocket message:' + JSON.stringify(error));
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.current.onclose = () => {
          setConnected(false);
          
          // Attempt to reconnect after retryDelay
          setTimeout(connect, retryDelay);
        };
        
        ws.current.onerror = (error) => {
          toast.error('WebSocket error:' + JSON.stringify(error))
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        toast.error('Error creating WebSocket connection:' + JSON.stringify(error))
        console.error('Error creating WebSocket connection:', error);
      }
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    connected,
    messages,
    sendMessage,
    clearMessages
  };
};