
import React from 'react';
import { ChatBubbleLeftRightIcon } from './icons'; // Assuming you'll create this icon

export const Header: React.FC = () => {
  return (
    <header className="py-8 text-center">
      <div className="flex items-center justify-center mb-2">
        <ChatBubbleLeftRightIcon className="h-12 w-12 text-sky-400 mr-3" />
        <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300">
          AI Meeting Note Assistant
        </h1>
      </div>
      <p className="text-slate-400 text-sm sm:text-base">
        Transform your meeting transcripts into actionable summaries, highlights, and tasks.
      </p>
    </header>
  );
};
