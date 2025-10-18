'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { Transition } from '@headlessui/react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface Machine {
  id: string;
  name: string;
}

interface AIAssistantProps {
  selectedMachine: Machine | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function AIAssistant({ selectedMachine }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedMachine) {
      setMessages([
        {
          id: 'initial-ai',
          sender: 'ai',
          text: `Bonjour ! Je suis l'assistant IA pour la machine **${selectedMachine.name}**. Comment puis-je vous aider aujourd'hui ?`,
          timestamp: new Date(),
        },
      ]);
    } else {
        setMessages([
            {
                id: 'initial-ai-no-machine',
                sender: 'ai',
                text: `Bonjour ! Je suis votre assistant IA. Sélectionnez une machine pour obtenir un contexte plus précis.`,
                timestamp: new Date(),
            },
        ]);
    }
  }, [selectedMachine]);


  const sendMessage = async () => {
    if (input.trim() === '') return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const payload = {
        question: input,
        machine_id: selectedMachine?.id,
      };
      const response = await axios.post(`${API_BASE_URL}/ai-assistant/`, payload);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Erreur lors de la communication avec l\'assistant IA :', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Désolé, une erreur est survenue. Veuillez réessayer plus tard.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg"> {/* bg-gray-800 ici */}
      <div className="flex items-center p-4 border-b border-gray-700 bg-indigo-600 rounded-t-lg">
        <SparklesIcon className="h-6 w-6 text-white mr-3" />
        <h2 className="text-xl font-semibold text-white">Assistant IA</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"> {/* Ajout de custom-scrollbar */}
        {messages.map((msg) => (
          <Transition
            key={msg.id}
            show={true}
            enter="transition ease-out duration-300"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-200"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <div
              className={`flex ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-700 text-gray-100' // Dark mode pour l'IA
                }`}
              >
                <p dangerouslySetInnerHTML={{ __html: (msg.text || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                <span className="block text-right text-xs mt-1 text-gray-400"> {/* Texte plus clair */}
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </Transition>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] p-3 rounded-lg shadow-md bg-gray-700 text-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce mr-1"></div>
                <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-150 mr-1"></div>
                <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700 flex items-center">
        <input
          type="text"
          className="flex-1 p-3 rounded-l-lg border border-gray-600 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Posez une question à l'IA..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          className="p-3 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          disabled={isLoading || input.trim() === ''}
        >
          <PaperAirplaneIcon className="h-5 w-5 rotate-90" />
        </button>
      </div>
    </div>
  );
}