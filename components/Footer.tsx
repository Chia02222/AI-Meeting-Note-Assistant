
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-8 text-center text-sm text-slate-500">
      <p>&copy; {new Date().getFullYear()} AI Meeting Assistant. Powered by Gemini.</p>
      <p>Note: Transcription for uploaded audio/video files is simulated. Recorded audio is transcribed via API.</p>
    </footer>
  );
};
