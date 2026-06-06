"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Chatbot.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8007';

export default function Chatbot() {
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'bot', text: 'You are welcome to Falibari Real Estate Management. How can I help you today?', properties: [] }
  ]);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  const suggestions = ["Accra properties", "Rentals in Kumasi", "Cheapest price", "Houses for sale"];

  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user && user.full_name) {
            const name = user.full_name.split(' ')[0];
            setChatHistory(prev => {
              if (prev[0] && prev[0].role === 'bot') {
                const updated = [...prev];
                updated[0] = { ...updated[0], text: `You are welcome to Falibari Real Estate Management, ${name}. How can I help you today?` };
                return updated;
              }
              return prev;
            });
            return;
          }
        } catch (e) {}
      }
      
      // Default greeting if not logged in
      setChatHistory(prev => {
        if (prev[0] && prev[0].role === 'bot') {
          const updated = [...prev];
          updated[0] = { ...updated[0], text: 'You are welcome to Falibari Real Estate Management. How can I help you today?' };
          return updated;
        }
        return prev;
      });
    };

    checkUser();
  }, [pathname, showChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, showChat]);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMessage = { role: 'user', text: chatMessage };
    setChatHistory(prev => [...prev, newMessage]);
    const userMsg = chatMessage;
    setChatMessage('');

    try {
      const response = await fetch(`${API}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'bot', text: data.response, properties: data.properties || [] }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'bot', text: 'Sorry, I am having trouble connecting to the server.' }]);
    }
  };

  const handleSuggestionClick = async (text) => {
    const newMessage = { role: 'user', text: text };
    setChatHistory(prev => [...prev, newMessage]);

    try {
      const response = await fetch(`${API}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'bot', text: data.response, properties: data.properties || [] }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'bot', text: 'Sorry, I am having trouble connecting to the server.' }]);
    }
  };

  if (!showChat) {
    return (
      <button className={styles.bubble} onClick={() => setShowChat(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>
    );
  }

  return (
    <div className={styles.window}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <div className={styles.statusDot}></div>
          AI Assistant
        </div>
        <button className={styles.closeBtn} onClick={() => setShowChat(false)}>
          <span className={styles.closeBtnText}>Close</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      <div className={styles.messages}>
        {chatHistory.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', width: '100%' }}>
            <div className={`${styles.message} ${msg.role === 'user' ? styles.userMsg : styles.botMsg}`} style={{ width: 'fit-content', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.suggestionsContainer}>
        {suggestions.map(s => (
          <button key={s} type="button" className={styles.suggestionTag} onClick={() => handleSuggestionClick(s)}>
            {s}
          </button>
        ))}
      </div>

      <form className={styles.inputArea} onSubmit={handleChat}>
        <button type="button" className={styles.bottomCloseBtn} onClick={() => setShowChat(false)} title="Close Chat">
          ✕
        </button>
        <input
          type="text"
          className={styles.input}
          placeholder="Ask about properties..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
        />
        <button type="submit" className={styles.sendBtn} disabled={!chatMessage.trim()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
  );
}
