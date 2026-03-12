import { VisaConfig } from '@/types/visa';
import { COMMON_STEPS } from './common';

export const GEORGIA_TOURIST: VisaConfig = {
    steps: [
        COMMON_STEPS.PERSONAL_PROFILE,
        COMMON_STEPS.CONTACT_AND_FAMILY,
        {
            ...COMMON_STEPS.PROFESSIONAL_FINANCIAL,
            fields: [
                ...COMMON_STEPS.PROFESSIONAL_FINANCIAL.fields,
                { name: 'section_financial_details', label: 'Additional Financial Details', type: 'section-header', required: false },
                { name: 'bankName', label: 'Primary Bank Name', type: 'text', required: true },
                { name: 'annualIncome', label: 'Annual Income', type: 'text', required: true },
            ]
        },
        COMMON_STEPS.TRIP_ACCOMMODATION,
        COMMON_STEPS.BACKGROUND_HISTORY,
        COMMON_STEPS.DECLARATION,
        COMMON_STEPS.REVIEW,
    ],
    documentsRequired: [
        { id: 'passport', name: 'Valid Passport (min 6 months validity beyond travel dates)', required: true },
        { id: 'photo', name: 'Recent Photo 3.5x4.5', required: true },
        { id: 'insurance', name: 'Travel Insurance (covering full stay)', required: true },
        { id: 'accommodation', name: 'Hotel Booking / Accommodation Proof', required: true },
        { id: 'flights', name: 'Return Flight Tickets (confirmed)', required: true },
        { id: 'bankStatement', name: 'Bank Statement (3 months, sufficient funds)', required: true },
        { id: 'incomeProof', name: 'ITR / Employment Letter / Business Proof', required: true },
        { id: 'aadhar', name: 'Aadhar Card (copy)', required: true },
    ],
    processingTime: '~15-20 business days',
    fee: 'Standard visa fee applies',
    notes: [
        'Processing time is approximately 15-20 business days.',
    ],
    embassyWarnings: [
        'Passport expiry must be > 6 months from travel date.'
    ]
}

export const BELARUS_TOURIST: VisaConfig = {
    steps: [
        COMMON_STEPS.PERSONAL_PROFILE,
        COMMON_STEPS.CONTACT_AND_FAMILY,
        {
            ...COMMON_STEPS.PROFESSIONAL_FINANCIAL,
            fields: [
                ...COMMON_STEPS.PROFESSIONAL_FINANCIAL.fields,
                { name: 'section_financial_details', label: 'Additional Financial Details', type: 'section-header', required: false },
                { name: 'bankName', label: 'Primary Bank Name', type: 'text', required: true },
                { name: 'annualIncome', label: 'Annual Income', type: 'text', required: true },
            ]
        },
        COMMON_STEPS.TRIP_ACCOMMODATION,
        COMMON_STEPS.BACKGROUND_HISTORY,
        COMMON_STEPS.DECLARATION,
        COMMON_STEPS.REVIEW,
    ],
    documentsRequired: [
        { id: 'passport', name: 'Valid Passport (min 3 months validity beyond stay)', required: true },
        { id: 'photo', name: 'Photo 3.5x4.5', required: true },
        { id: 'insurance', name: 'Travel Insurance (mandatory)', required: true },
        { id: 'accommodationHost', name: 'Hotel/Invitation from host in Belarus', required: true },
        { id: 'flights', name: 'Confirmed Return Flight Ticket', required: true },
        { id: 'bankStatement', name: 'Bank Statement (3 months)', required: true },
        { id: 'employmentIncome', name: 'Proof of Employment / Income', required: true },
    ],
    processingTime: '~20-30 business days',
    fee: 'Standard visa fee applies',
    notes: [
        'Processing time is approximately 20-30 business days.',
    ]
}
