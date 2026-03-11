/**
 * GovTopBar — Government identity bar above the navbar
 * Similar to official Indian government websites (DigiLocker, UIDAI)
 */
'use client';

import React from 'react';
import { useLocale } from '@/hooks/useLocale';

export function GovTopBar() {
  const { locale } = useLocale();
  const isMl = locale === 'ml';

  return (
    <div className="bg-[#1E3A8A] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
          <span className="font-medium">
            {isMl ? 'ഔദ്യോഗിക സർക്കാർ വെബ്സൈറ്റ്' : 'Official Government Website'}
          </span>
        </div>
        <span className="hidden font-semibold sm:block">
          {isMl ? 'ഇന്ത്യാ ഗവൺമെന്റ്' : 'Government of India'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-medium">
            {isMl ? 'ഹെൽപ്ലൈൻ' : 'Helpline'}:
          </span>
          <a
            href="tel:1950"
            className="font-bold underline-offset-2 hover:underline"
          >
            1950
          </a>
        </div>
      </div>
    </div>
  );
}
