
export interface MeetingNotes {
  summary: string;
  actionItems: string[];
  discussionHighlights: string[];
  followUps: string[];
}

export enum InputMode {
  FILE = 'file',
  RECORD = 'record',
}

// For Gemini Search Grounding (if used in future, not currently implemented in this version)
export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Can add other types like "retrievedContext" if needed
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // Other grounding metadata fields
}
