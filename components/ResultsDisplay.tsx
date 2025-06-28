
import React from 'react';
import { MeetingNotes } from '../types';
import { LightBulbIcon, CheckCircleIcon, ChatBubbleBottomCenterTextIcon, ArrowRightCircleIcon, InformationCircleIcon } from './icons';

interface ResultsDisplayProps {
  notes: MeetingNotes;
}

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; isEmpty?: boolean; emptyText?: string }> = ({ title, icon, children, isEmpty, emptyText }) => {
  return (
    <div className="bg-slate-700/70 p-6 rounded-xl shadow-lg_ transition-all hover:shadow-sky-500/10">
      <div className="flex items-center text-sky-400 mb-3">
        {icon}
        <h3 className="text-xl font-semibold ml-2">{title}</h3>
      </div>
      {isEmpty ? (
        <p className="text-slate-400 italic flex items-center">
          <InformationCircleIcon className="w-5 h-5 mr-2 text-slate-500" />
          {emptyText || `No ${title.toLowerCase()} identified.`}
        </p>
      ) : (
        <div className="text-slate-300 space-y-2 prose prose-sm prose-invert max-w-none 
                        prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-li:marker:text-sky-400">
          {children}
        </div>
      )}
    </div>
  );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ notes }) => {
  const { summary, actionItems, discussionHighlights, followUps } = notes;

  return (
    <section aria-labelledby="meeting-notes-title" className="space-y-6 mt-8">
      <h2 id="meeting-notes-title" className="text-2xl font-semibold text-sky-300 mb-6 border-b border-slate-700 pb-3">
        Your AI Generated Meeting Notes
      </h2>

      <SectionCard title="Summary" icon={<LightBulbIcon className="w-6 h-6" />} isEmpty={!summary.trim()} emptyText="No summary could be generated.">
        <p>{summary}</p>
      </SectionCard>

      <SectionCard title="Action Items" icon={<CheckCircleIcon className="w-6 h-6" />} isEmpty={!actionItems || actionItems.length === 0}>
        {actionItems && actionItems.length > 0 ? (
          <ul className="list-disc list-inside">
            {actionItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        ) : null}
      </SectionCard>

      <SectionCard title="Discussion Highlights" icon={<ChatBubbleBottomCenterTextIcon className="w-6 h-6" />} isEmpty={!discussionHighlights || discussionHighlights.length === 0}>
         {discussionHighlights && discussionHighlights.length > 0 ? (
          <ul className="list-disc list-inside">
            {discussionHighlights.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        ) : null}
      </SectionCard>

      <SectionCard title="Follow-ups" icon={<ArrowRightCircleIcon className="w-6 h-6" />} isEmpty={!followUps || followUps.length === 0}>
        {followUps && followUps.length > 0 ? (
          <ul className="list-disc list-inside">
            {followUps.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        ) : null}
      </SectionCard>
    </section>
  );
};
