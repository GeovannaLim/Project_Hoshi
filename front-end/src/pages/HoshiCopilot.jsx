import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Bot, User, Loader2, Volume2 } from "lucide-react";
import { hoshiApi } from "@/lib/hoshiApi";
import GlassPanel from "@/components/hoshi/GlassPanel";

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-primary/20 border border-primary/30" : "bg-violet-500/20 border border-violet-500/30"}`}>
        {isUser ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-violet-400" />}
      </div>
      <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm font-mono leading-relaxed ${isUser ? "bg-primary/10 border border-primary/20 text-foreground" : "glass border border-border/30 text-foreground"}`}>
        {msg.content}
      </div>
    </motion.div>
  );
}

export default function HoshiCopilot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "HOSHI online. I have access to real-time orbital data, risk assessments, and mission telemetry. How can I assist you?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakText = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1.1;
    utter.pitch = 1.0;

    // Pick the best English voice available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === "en-US" && v.name.toLowerCase().includes("google"))
      || voices.find(v => v.lang === "en-US" && !v.localService)
      || voices.find(v => v.lang === "en-US")
      || voices.find(v => v.lang.startsWith("en"));
    if (preferred) utter.voice = preferred;

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const q = text.trim();
    if (!q) return;
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setInput("");
    setIsLoading(true);

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 150000)
    );

    let reply;
    try {
      const res = await Promise.race([hoshiApi.askHoshi(q), timeout]);
      reply = res?.answer ?? res?.response ?? res?.message ?? JSON.stringify(res);
    } catch {
      reply = "Request timed out. Please try again.";
    }

    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setIsLoading(false);

    // Ensure voices are loaded before speaking
    const trySpeak = () => speakText(reply);
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = trySpeak;
    } else {
      trySpeak();
    }
  }, [speakText]);

  const toggleListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      sendMessage(transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, [isListening, sendMessage]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-orbitron text-2xl font-bold text-glow">HOSHI Copilot</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">AI-powered orbital intelligence assistant</p>
      </motion.div>

      <div className="flex flex-col h-[calc(100vh-240px)] glass rounded-xl border border-border/30 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-orbitron font-semibold uppercase tracking-wider">HOSHI AI</span>
          </div>
          {isSpeaking && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-violet-400">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span>Speaking...</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          </AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-violet-400" />
              </div>
              <div className="glass border border-border/30 rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                <span className="text-xs font-mono text-muted-foreground">Processing query...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-border/30 flex items-center gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Ask HOSHI about orbital status, risks, maneuvers..."
            className="flex-1 bg-secondary/50 border border-border/30 rounded-lg px-4 py-2.5 text-sm font-mono text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={toggleListening}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isListening ? "bg-red-500/20 border border-red-500/40 text-red-400" : "bg-secondary border border-border/30 text-muted-foreground hover:text-foreground"}`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}