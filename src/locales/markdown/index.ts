import { terms as enTerms } from './en/terms';
import { privacyPolicy as enPrivacyPolicy } from './en/privacyPolicy';
import { terms as esTerms } from './es/terms';
import { privacyPolicy as esPrivacyPolicy } from './es/privacyPolicy';

export const getTermsMarkdown = (lng: string): string => {
  const cleanLng = (lng || 'en').split('-')[0].toLowerCase();
  switch (cleanLng) {
    case 'es':
      return esTerms;
    case 'en':
    default:
      return enTerms;
  }
};

export const getPrivacyPolicyMarkdown = (lng: string): string => {
  const cleanLng = (lng || 'en').split('-')[0].toLowerCase();
  switch (cleanLng) {
    case 'es':
      return esPrivacyPolicy;
    case 'en':
    default:
      return enPrivacyPolicy;
  }
};
