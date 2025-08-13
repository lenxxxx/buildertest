'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '@/app/context/ShopContext';
import { db } from '@/app/lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ChatPanel() {
  // Single, correct destructuring from the context hook.
  const { user, currentShop } = useShop();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const lastProcessedMessageId = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user || !currentShop) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const messagesCollection = collection(db, `users/${user.uid}/shops/${currentShop.id}/messages`);
    const q = query(messagesCollection, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setLoading(false);

      const lastMessage = msgs[msgs.length - 1];

      if (lastMessage && lastMessage.sender === 'user' && lastMessage.id !== lastProcessedMessageId.current) {
        lastProcessedMessageId.current = lastMessage.id;

        setTimeout(() => {
          addDoc(messagesCollection, {
            text: `Bien reçu ! Votre demande concernant "${lastMessage.text}" est en cours de traitement.`,
            sender: 'assistant',
            createdAt: serverTimestamp(),
          });
        }, 1000);
      }
    }, (err) => {
      console.error("[ChatPanel] Firestore error:", err);
      setError("Erreur lors de la récupération des messages.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, currentShop]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user || !currentShop) {
      return;
    }

    setIsSending(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/shops/${currentShop.id}/messages`), {
        text: input,
        sender: 'user',
        createdAt: serverTimestamp(),
      });
      setInput('');
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Erreur lors de l'envoi du message.");
    } finally {
      setIsSending(false);
    }
  };

  const renderContent = () => {
    if (!currentShop) {
      return <div className="text-center text-gray-500 h-full flex items-center justify-center">Sélectionnez une boutique pour voir la conversation.</div>;
    }
    if (loading) {
      return <div className="text-center text-gray-500">Chargement des messages...</div>;
    }
    if (error && !messages.length) {
      return <div className="text-center text-red-500">{error}</div>;
    }
    if (messages.length === 0) {
      return <div className="text-center text-gray-500">Aucun message pour cette boutique.</div>;
    }
    return (
      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-lg px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  return (
    <main className="flex flex-col h-screen bg-white">
      <div className="flex-grow p-6 overflow-y-auto">
        {renderContent()}
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentShop ? `Message pour ${currentShop.name}...` : "Sélectionnez une boutique"}
            className="flex-grow px-4 py-2 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Zone de saisie de message"
            disabled={!currentShop || isSending}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white font-semibold px-6 py-2 rounded-full hover:bg-blue-600 disabled:bg-blue-300 transition-colors duration-200"
            aria-label="Envoyer le message"
            disabled={!input.trim() || !currentShop || isSending}
          >
            {isSending ? 'Envoi...' : 'Send'}
          </button>
        </form>
      </div>
    </main>
  );
}