import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FileUpload } from './components/FileUpload';
import { AudioRecorder } from './components/AudioRecorder';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { summarizeTranscript, transcribeAudio } from './services/geminiService';
import { MeetingNotes, InputMode } from './types';
import { UploadIcon, MicrophoneIcon, SparklesIcon, AlertTriangleIcon } from './components/icons';

const App: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.FILE);
  const [transcript, setTranscript] = useState<string>('');
  const [meetingNotes, setMeetingNotes] = useState<MeetingNotes | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isProcessingInput, setIsProcessingInput] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'missing'>('checking');

  useEffect(() => {
    if (process.env.API_KEY && process.env.API_KEY.trim() !== '') {
      setApiKeyStatus('valid');
    } else {
      setApiKeyStatus('missing');
    }
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setFileName(file.name);
    setIsProcessingInput(true);
    setError(null);
    setMeetingNotes(null);
    setTranscript('');

    const supportedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];
    // Common extensions for quick checks, primary check is file.type
    const audioFileExtensions = ['.mp3', '.wav', '.m4a', '.aac'];


    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setTranscript(text);
        setIsProcessingInput(false);
      };
      reader.onerror = () => {
        setError('Failed to read text file.');
        setIsProcessingInput(false);
      };
      reader.readAsText(file);
    } else if (supportedAudioTypes.includes(file.type) || audioFileExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      if (apiKeyStatus === 'missing') {
        setError('API Key is missing. Cannot transcribe uploaded audio. Please configure the API Key.');
        setIsProcessingInput(false);
        return;
      }
      try {
        const transcribedText = await transcribeAudio(file, file.type || 'application/octet-stream'); // Pass file (which is a Blob)
        setTranscript(transcribedText);
      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during audio transcription.';
        setError(`Failed to transcribe uploaded audio: ${errorMessage}`);
        setTranscript('');
      } finally {
        setIsProcessingInput(false);
      }
    } else {
      // Unsupported file type
      const errorMsg = `Unsupported file type: '${file.type || 'unknown'}' (${file.name}). Please upload a .txt, .mp3, .wav, .m4a, or .aac file.`;
      setError(errorMsg);
      setTranscript('');
      setIsProcessingInput(false);
    }
  }, [apiKeyStatus]);

  const handleAudioRecorded = useCallback(async (audioBlob: Blob) => {
    setTranscript('');
    setMeetingNotes(null);
    setError(null);
    setFileName('recorded_audio.wav');
    setIsProcessingInput(true);

    if (apiKeyStatus === 'missing') {
      setError('API Key is missing. Cannot transcribe audio. Please configure the API Key.');
      setIsProcessingInput(false);
      return;
    }

    try {
      const transcribedText = await transcribeAudio(audioBlob, 'audio/wav');
      setTranscript(transcribedText);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(`Failed to transcribe audio: ${err.message}`);
      } else {
        setError('An unknown error occurred during audio transcription.');
      }
      setTranscript('');
    } finally {
      setIsProcessingInput(false);
    }
  }, [apiKeyStatus]);

  const handleGenerateSummary = async () => {
    if (!transcript.trim()) {
      setError('Transcript is empty. Please provide or generate some text to summarize.');
      return;
    }
    if (apiKeyStatus === 'missing') {
      setError('API Key is missing. Please ensure it is configured in your environment to summarize.');
      return;
    }

    setIsLoadingSummary(true);
    setError(null);
    setMeetingNotes(null);

    try {
      const notes = await summarizeTranscript(transcript);
      setMeetingNotes(notes);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(`Failed to generate summary: ${err.message}`);
      } else {
        setError('An unknown error occurred while generating summary.');
      }
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const renderInputArea = () => {
    switch (inputMode) {
      case InputMode.FILE:
        return <FileUpload onFileSelect={handleFileSelect} disabled={isProcessingInput || isLoadingSummary} />;
      case InputMode.RECORD:
        return <AudioRecorder onRecordingComplete={handleAudioRecorded} disabled={isProcessingInput || isLoadingSummary || apiKeyStatus === 'missing'} />;
      default:
        return <FileUpload onFileSelect={handleFileSelect} disabled={isProcessingInput || isLoadingSummary} />;
    }
  };

  const getProcessingMessage = () => {
    if (!isProcessingInput) return null;
    if (inputMode === InputMode.RECORD) {
        return "Transcribing recorded audio via Gemini API... This may take a moment.";
    }
    if (inputMode === InputMode.FILE && fileName) {
        const lcFileName = fileName.toLowerCase();
        const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac'];
        if (audioExtensions.some(ext => lcFileName.endsWith(ext))) {
            return "Transcribing uploaded audio file via Gemini API... This may take a moment.";
        }
        if (lcFileName.endsWith('.txt')) {
             return "Loading text file content...";
        }
    }
    return "Processing input...";
  }

  const getTranscriptAreaLabel = () => {
    if (inputMode === InputMode.RECORD) {
        return isProcessingInput ? "Transcript from recording will appear below once transcription is complete:" : "Review or edit the transcript from your recording below:";
    }
    if (inputMode === InputMode.FILE) {
        if (isProcessingInput) return "Transcript will appear below once processing is complete:";
        return "Review or edit the transcript from your uploaded file (text or transcribed audio):";
    }
    return "Review or edit the transcript below:";
  }
  
  const renderFileStatusMessage = () => {
    if (!fileName || isProcessingInput) return null;

    let message = "";
    let messageType: 'error' | 'success' | 'info' = 'info';

    if (error && (!transcript || transcript.length === 0)) {
        message = `Error with ${fileName}. Check messages above.`;
        messageType = 'error';
    } else if (transcript && transcript.length > 0) {
        const lcFileName = fileName.toLowerCase();
        if (inputMode === InputMode.FILE) {
            if (lcFileName.endsWith('.txt')) {
                message = `Loaded: ${fileName}.`;
            } else if (['.mp3', '.wav', '.m4a', '.aac'].some(ext => lcFileName.endsWith(ext))) {
                message = `Transcribed: ${fileName}.`;
            } else {
                 // This case should be rare if unsupported files trigger an error
                message = `Processed: ${fileName}. Review content.`;
            }
        } else if (inputMode === InputMode.RECORD) {
            message = `Transcribed: ${fileName}.`;
        }
        messageType = 'success';
    } else { // No error, no transcript, file selected
        message = `Selected: ${fileName}. `;
        if (inputMode === InputMode.FILE) {
            const lcFileName = fileName.toLowerCase();
            if (lcFileName.endsWith('.txt')) {
                message += "Ready to load content.";
            } else if (['.mp3', '.wav', '.m4a', '.aac'].some(ext => lcFileName.endsWith(ext))) {
                message += apiKeyStatus === 'missing' ? "API key missing for transcription." : "Ready to transcribe.";
            } else {
                message += "Unsupported file type for direct processing.";
            }
        }
    }

    if (!message) return null;

    const colorClass = messageType === 'error' ? 'text-red-400' :
                       messageType === 'success' ? 'text-green-400' :
                       'text-sky-300';

    return (
        <p className={`text-sm mt-2 mb-2 px-1`} role="status">
            <span className={`font-medium ${colorClass}`}>{message}</span>
        </p>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 font-[Inter,sans-serif]">
      <div className="w-full max-w-4xl">
        <Header />
        <main className="bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-10 space-y-8">

          {apiKeyStatus === 'missing' && (
            <div className="bg-red-700/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg relative flex items-start space-x-2" role="alert">
              <AlertTriangleIcon className="h-5 w-5 text-red-300 mt-0.5" />
              <div>
                <strong className="font-bold">API Key Missing!</strong>
                <span className="block sm:inline"> The Gemini API key is not configured. Please set the <code>process.env.API_KEY</code> environment variable. Transcription and summarization features will not work.</span>
              </div>
            </div>
          )}

          <section aria-labelledby="input-selection-title">
            <h2 id="input-selection-title" className="text-xl font-semibold text-sky-400 mb-4">
              1. Provide Meeting Content
            </h2>
            <div className="flex space-x-2 sm:space-x-4 mb-4 border-b border-slate-700 pb-4">
              {[
                { mode: InputMode.FILE, label: 'Upload File', icon: <UploadIcon className="w-5 h-5 mr-2" /> },
                { mode: InputMode.RECORD, label: 'Record Audio', icon: <MicrophoneIcon className="w-5 h-5 mr-2" /> },
              ].map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  onClick={() => { setInputMode(mode); setTranscript(''); setFileName(null); setMeetingNotes(null); setError(null); setIsProcessingInput(false); }}
                  disabled={isLoadingSummary || isProcessingInput}
                  className={`flex-1 sm:flex-initial flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ease-in-out
                    ${inputMode === mode ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}
                    ${(mode === InputMode.RECORD && apiKeyStatus === 'missing') ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50 disabled:cursor-not-allowed'}`}
                  title={mode === InputMode.RECORD && apiKeyStatus === 'missing' ? 'Audio recording disabled: API Key missing' : label}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
            {isProcessingInput && (
                <div className="flex items-center justify-center space-x-2 text-sky-400 p-4 rounded-lg bg-slate-700/50 my-4">
                    <LoadingSpinner className="w-5 h-5"/> <span>{getProcessingMessage()}</span>
                </div>
            )}
            {renderInputArea()}
            {renderFileStatusMessage()}
          </section>

          <section aria-labelledby="transcript-input-title">
            <label htmlFor="transcript-input" className="block text-lg font-medium text-slate-300 mb-2">
              {getTranscriptAreaLabel()}
            </label>
            <textarea
              id="transcript-input"
              rows={10}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                apiKeyStatus === 'missing' && (inputMode === InputMode.RECORD || inputMode === InputMode.FILE) ? "Transcription disabled: API key missing." :
                inputMode === InputMode.RECORD ? "Transcript from your recording will appear here..." :
                inputMode === InputMode.FILE ? "Transcript from .txt or supported audio files (.mp3, .wav, .m4a, .aac) will appear here..." :
                "Your meeting transcript will appear here. You can also edit it directly."
              }
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-inner focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-200 placeholder-slate-500 transition-colors"
              disabled={isLoadingSummary || isProcessingInput || (inputMode === InputMode.RECORD && apiKeyStatus === 'missing') || (inputMode === InputMode.FILE && apiKeyStatus === 'missing' && (!fileName || !fileName.toLowerCase().endsWith('.txt')))}
              aria-live="polite"
            />
          </section>

          <section className="text-center">
            <button
              onClick={handleGenerateSummary}
              disabled={isLoadingSummary || isProcessingInput || !transcript.trim() || apiKeyStatus === 'missing'}
              className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              {isLoadingSummary ? 'Generating Notes...' : 'Generate AI Meeting Notes'}
            </button>
          </section>

          {error && (
            <div className="bg-red-700/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg relative flex items-start space-x-2" role="alert">
              <AlertTriangleIcon className="h-5 w-5 text-red-300 mt-0.5" />
              <div>
                <strong className="font-bold">Error</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            </div>
          )}

          {isLoadingSummary && !meetingNotes && (
             <div className="flex flex-col items-center justify-center space-y-3 text-sky-400 p-6 rounded-lg bg-slate-700/50">
                <LoadingSpinner className="w-10 h-10"/>
                <p className="text-lg">AI is thinking... Your notes will appear shortly.</p>
            </div>
          )}

          {meetingNotes && !isLoadingSummary && (
            <ResultsDisplay notes={meetingNotes} />
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;