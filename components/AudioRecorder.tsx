
import React, { useEffect } from 'react';
import { useAudioRecorder, AudioRecorderState } from '../hooks/useAudioRecorder';
import { MicrophoneIcon, StopCircleIcon, PlayCircleIcon, ArrowPathIcon, AlertTriangleIcon } from './icons';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, disabled }) => {
  const { isRecording, audioURL, startRecording, stopRecording, error, resetRecording }: AudioRecorderState = useAudioRecorder();

  const handleStartRecording = async () => {
    if (disabled) return;
    await startRecording();
  };

  const handleStopRecording = async () => {
    if (disabled) return;
    const audioBlob = await stopRecording();
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetRecording();
    };
  }, [resetRecording]);

  return (
    <div className="p-4 bg-slate-700/50 rounded-lg shadow space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
        {!isRecording && !audioURL && (
          <button
            onClick={handleStartRecording}
            disabled={disabled || isRecording}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MicrophoneIcon className="w-5 h-5 mr-2" />
            Start Recording
          </button>
        )}
        {isRecording && (
          <button
            onClick={handleStopRecording}
            disabled={disabled}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-150 ease-in-out disabled:opacity-50"
          >
            <StopCircleIcon className="w-5 h-5 mr-2" />
            Stop Recording
          </button>
        )}
        
        {audioURL && !isRecording && (
            <button
                onClick={() => {
                    resetRecording(); 
                }}
                disabled={disabled}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-all duration-150 ease-in-out disabled:opacity-50"
            >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Record Again
            </button>
        )}

        {isRecording && <div className="text-sm text-yellow-400 flex items-center"><LoadingPulse /> Recording...</div>}
      </div>

      {audioURL && !isRecording && (
        <div className="mt-4 p-3 bg-slate-600 rounded-lg">
          <p className="text-sm text-green-400 mb-2">Recording complete! You can preview it below.</p>
          <audio src={audioURL} controls className="w-full" />
        </div>
      )}
      {error && (
        <div className="mt-3 bg-red-700/30 border border-red-600 text-red-300 px-3 py-2 rounded-md text-sm flex items-center space-x-2">
          <AlertTriangleIcon className="h-5 w-5"/>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const LoadingPulse: React.FC = () => (
  <span className="relative flex h-3 w-3 mr-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
  </span>
);
