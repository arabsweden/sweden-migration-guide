
import React from 'react';

const LegalDisclaimer: React.FC = () => {
  return (
    <div className="bg-red-50 border-r-4 border-red-500 p-4 mb-4 text-sm text-red-800 leading-relaxed rounded-l-lg shadow-sm">
      <p className="font-bold mb-1">⚠️ تنبيه قانوني هام:</p>
      هذا محتوى تعليمي فقط وليس استشارة قانونية. القوانين تتغير باستمرار. 
      تحقق دائماً من موقع مصلحة الهجرة السويدية 
      <a href="https://www.migrationsverket.se" target="_blank" className="font-bold underline mx-1">
        www.migrationsverket.se
      </a> 
      أو استشر محامياً مختصاً.
    </div>
  );
};

export default LegalDisclaimer;
