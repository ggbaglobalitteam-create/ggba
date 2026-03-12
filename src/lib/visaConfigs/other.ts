import { VisaConfig } from '@/types/visa';
import { COMMON_STEPS } from './common';

// Helper function to create configs that mainly differ in documents
const createStandardConfig = (processingTime: string, documentsRequired: any[]): VisaConfig => ({
    steps: [
        COMMON_STEPS.PERSONAL_PROFILE,
        COMMON_STEPS.CONTACT_AND_FAMILY,
        COMMON_STEPS.PROFESSIONAL_FINANCIAL,
        COMMON_STEPS.TRIP_ACCOMMODATION,
        COMMON_STEPS.BACKGROUND_HISTORY,
        COMMON_STEPS.DECLARATION,
        COMMON_STEPS.REVIEW,
    ],
    documentsRequired,
    processingTime,
    fee: 'Standard visa fee applies',
    notes: [`Processing time is approximately ${processingTime}.`],
});

export const GEORGIA_BUSINESS: VisaConfig = createStandardConfig('~15 business days', [
    { id: 'passport', name: 'Passport', required: true },
    { id: 'invitation', name: 'Business invitation letter from Georgian company', required: true },
    { id: 'companyReg', name: 'Company registration documents (home country)', required: true },
    { id: 'bankStatement', name: 'Bank Statement (3 months)', required: true },
    { id: 'employmentLetter', name: 'Employment letter / Director appointment letter', required: true },
    { id: 'insurance', name: 'Travel Insurance', required: true },
    { id: 'photo', name: 'Photo 3.5x4.5', required: true },
]);

export const BELARUS_BUSINESS: VisaConfig = createStandardConfig('~20 business days', [
    { id: 'passport', name: 'Passport', required: true },
    { id: 'invitation', name: 'Invitation from Belarusian organization (MFA registered)', required: true },
    { id: 'companyReg', name: 'Company registration proof', required: true },
    { id: 'bankStatement', name: 'Bank Statement', required: true },
    { id: 'businessLetter', name: 'Business purpose letter on company letterhead', required: true },
    { id: 'insurance', name: 'Travel Insurance', required: true },
    { id: 'photo', name: 'Photo 3.5x4.5', required: true },
]);

export const GENERIC_WORK: VisaConfig = createStandardConfig('~45-60 business days', [
    { id: 'passport', name: 'Passport', required: true },
    { id: 'workPermit', name: 'Work permit / Employment contract from destination country employer', required: true },
    { id: 'degree', name: 'Academic qualifications / Degree certificates', required: true },
    { id: 'medical', name: 'Medical fitness certificate', required: true },
    { id: 'pcc', name: 'Police Clearance Certificate (PCC)', required: true },
    { id: 'photo', name: 'Photo 3.5x4.5', required: true },
    { id: 'bankStatement', name: 'Bank Statement', required: true },
    { id: 'insurance', name: 'Travel Insurance', required: true },
]);

// Used for both Georgia and Belarus
export const GEORGIA_WORK = GENERIC_WORK;
export const BELARUS_WORK = GENERIC_WORK;

export const GENERIC_MEDICAL: VisaConfig = createStandardConfig('~10-15 business days', [
    { id: 'passport', name: 'Passport', required: true },
    { id: 'medicalInvitation', name: 'Medical invitation / appointment letter from hospital', required: true },
    { id: 'financialProof', name: 'Proof of financial capacity', required: true },
    { id: 'insurance', name: 'Travel Insurance', required: true },
    { id: 'photo', name: 'Photo 3.5x4.5', required: true },
    { id: 'doctorReferral', name: 'Doctor referral letter (from home country)', required: true },
]);

export const GEORGIA_MEDICAL = GENERIC_MEDICAL;
export const BELARUS_MEDICAL = GENERIC_MEDICAL;

export const GENERIC_TRANSIT: VisaConfig = createStandardConfig('~5-7 business days', [
    { id: 'passport', name: 'Passport', required: true },
    { id: 'onwardTicket', name: 'Onward travel ticket', required: true },
    { id: 'destinationVisa', name: 'Visa for final destination country', required: true },
    { id: 'photo', name: 'Photo 3.5x4.5', required: true },
]);

export const GEORGIA_TRANSIT = GENERIC_TRANSIT;
export const BELARUS_TRANSIT = GENERIC_TRANSIT;

export const GENERIC_FAMILY: VisaConfig = createStandardConfig('~30-45 business days', [
    { id: 'passport', name: 'Passport', required: true },
    { id: 'relationshipProof', name: 'Proof of relationship (marriage/birth certificate - apostilled)', required: true, apostilleRequired: true },
    { id: 'sponsorVisa', name: 'Sponsor\'s residency permit / visa in destination country', required: true },
    { id: 'sponsorBank', name: 'Sponsor\'s bank statement', required: true },
    { id: 'invitation', name: 'Invitation letter from sponsor', required: true },
    { id: 'aadhar', name: 'Aadhar card', required: true },
    { id: 'pcc', name: 'Police Clearance Certificate', required: true },
    { id: 'photo', name: 'Photo 3.5x4.5', required: true },
]);

export const GEORGIA_FAMILY = GENERIC_FAMILY;
export const BELARUS_FAMILY = GENERIC_FAMILY;
