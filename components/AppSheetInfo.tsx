
import React from 'react';

const AppSheetInfo: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 font-sans text-sm animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-blue-900">AppSheet Setup & Schema</h2>
      
      <div className="space-y-6">
        <section>
          <h3 className="font-bold text-slate-800 border-b pb-2 mb-2">1. Table: Episodes (Google Sheets)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-2 border">Field</th>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">AppSheet Key</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-2 border font-mono">id</td><td className="p-2 border">Text</td><td className="p-2 border font-bold text-blue-600">YES</td></tr>
                <tr><td className="p-2 border font-mono">title_ar</td><td className="p-2 border">Text</td><td className="p-2 border">-</td></tr>
                <tr><td className="p-2 border font-mono">category</td><td className="p-2 border">Ref</td><td className="p-2 border">Ref to Categories</td></tr>
                <tr><td className="p-2 border font-mono">audio_url</td><td className="p-2 border">URL</td><td className="p-2 border">-</td></tr>
                <tr><td className="p-2 border font-mono">script_ar</td><td className="p-2 border">LongText</td><td className="p-2 border">-</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 border-b pb-2 mb-2">2. Voice Configuration</h3>
          <p className="text-slate-600 leading-relaxed mb-2">
            For natural sounding Arabic, use the Gemini TTS model in your automation bot with these settings:
          </p>
          <ul className="list-disc list-inside text-slate-500 space-y-1">
            <li>Model: <code className="bg-slate-100 px-1">gemini-2.5-flash-preview-tts</code></li>
            <li>Voice: <code className="bg-slate-100 px-1">Kore</code> (Male) or <code className="bg-slate-100 px-1">Puck</code> (Female)</li>
            <li>Sample Rate: <code className="bg-slate-100 px-1">24000</code></li>
          </ul>
        </section>

        <section className="bg-blue-50 p-4 rounded-xl">
          <h3 className="font-bold text-blue-900 mb-2">🚀 Pro Tip: AppSheet Automation</h3>
          <p className="text-blue-800 text-xs">
            Create an AppSheet "Automation" that triggers on a new row in the "Episodes" table. 
            The step should call a script that sends the <code className="bg-white/50 px-1">script_ar</code> 
            to Gemini and saves the returned audio bytes as a file in Google Drive.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AppSheetInfo;
