import { VisaConfig } from '@/types/visa';
import { COMMON_STEPS } from './common';

export const GEORGIA_STUDENT: VisaConfig = {
    steps: [
        COMMON_STEPS.PERSONAL_PROFILE,
        COMMON_STEPS.CONTACT_AND_FAMILY,
        {
            ...COMMON_STEPS.PROFESSIONAL_FINANCIAL,
            fields: [
                ...COMMON_STEPS.PROFESSIONAL_FINANCIAL.fields,
                { name: 'section_sponsor_details', label: '7. Sponsor / Financial Details', type: 'section-header', required: false },
                { name: 'sponsorName', label: 'Sponsor Name', type: 'text', required: true },
                { name: 'sponsorRelation', label: 'Relationship to Applicant', type: 'text', required: true },
                { name: 'sponsorOccupation', label: 'Sponsor Occupation', type: 'text', required: true },
                { name: 'sponsorIncome', label: 'Sponsor Annual Income', type: 'text', required: true },
            ]
        },
        {
            ...COMMON_STEPS.TRIP_ACCOMMODATION,
            fields: [
                ...COMMON_STEPS.TRIP_ACCOMMODATION.fields,
                { name: 'section_education_details', label: '10. Education Details', type: 'section-header', required: false },
                { name: 'universityName', label: 'University Name', type: 'text', required: true },
                { name: 'courseName', label: 'Course / Program', type: 'text', required: true },
                { name: 'courseDuration', label: 'Course Duration', type: 'text', required: true },
                { name: 'moiLanguage', label: 'Mode of Instruction Language', type: 'select', required: true, options: ['English', 'Georgian', 'Other'] },
                { name: 'admissionLetter', label: 'Admission Letter (Upload in Documents)', type: 'select', required: true, options: ['Yes', 'No'] },
                { name: 'moiLetterOrIelts', label: 'MOI Letter OR IELTS Score (Upload in Documents)', type: 'select', required: true, options: ['Yes', 'No'] },
            ]
        },
        COMMON_STEPS.BACKGROUND_HISTORY,
        COMMON_STEPS.DECLARATION,
        COMMON_STEPS.REVIEW,
    ],
    documentsRequired: [
        { id: 'passport', name: 'Valid Passport (15 months min validity, 3 blank pages)', required: true },
        { id: 'photo', name: 'Photo 3.5x4.5 (white bg, 75% face, digital + 2 hard copies)', required: true },
        { id: 'marksheet10_12', name: '(Must be Appostiled from MEA) 10th and 12th Marksheets', required: true },
        { id: 'bachelorTranscript', name: '(Must be Appostiled from MEA) Bachelor transcript', infoLabel: 'single page, if applying for Masters', required: false },
        { id: 'insurance', name: 'Travel Insurance', required: true },
        { id: 'moi_ielts', name: 'MOI Letter from school OR IELTS score', infoLabel: 'MUST for Georgia student visa', required: false },
        { id: 'bankStatement', name: 'Sponsor\'s Bank Statement (6 months old, original + verifiable)', required: true },
        { id: 'bankBalanceCert', name: 'Bank Balance Certificate', infoLabel: 'with sign, stamp, branch contact on official paper', required: true },
        { id: 'sponsorAffidavit', name: 'Sponsor Affidavit of Support', infoLabel: '*(Self/Parents/Siblings can only Sponsor)', required: true, apostilleRequired: true, notarizationRequired: true },
        { id: 'sponsorIncomeProof', name: 'Sponsor Proof of Income', infoLabel: 'MUST for Georgia student visa', required: false },
        { id: 'sponsorId', name: 'Sponsor ID', infoLabel: 'Aadhar or passport front+back', required: true, notarizationRequired: true },
        { id: 'selfReferenceVideo', name: 'Video of student - 2 minutes self-introduction', required: true },
        { id: 'applicantAadhar', name: 'Applicant\'s Aadhar', infoLabel: 'It must be notarized.', required: true, notarizationRequired: true },
        { id: 'pcc', name: 'Police Clearance Certificate (PCC)', infoLabel: 'MUST for Georgia student visa. Must be apostilled from the MEA (max 3 months old).', required: false, apostilleRequired: true },
        { id: 'medicalDocs', name: 'Medical certificate/Reports', infoLabel: 'HIV REPORTS ARE MUST FOR BELARUS STUDENT APPLICANTS', required: false },
        { id: 'invitationDocs', name: 'ORIGINAL INVITATION/PERMIT;CONTRACT; ACCOMODATION LETTER; OTHERS FROM BELARUS BASED COMPANY', infoLabel: 'MUST for Belarus Work-permit category. Please upload all these docs (together/ merged) in a single pdf.', required: false },
        { id: 'flightDocs', name: 'Flight Itinerary/Reservation', required: false },
    ],
    processingTime: '~90 business days (30 for invitation letter + 60-90 embassy)',
    fee: 'Excludes Embassy/Consulate fee(s). Your bank may charge forex/transaction fee.',
    notes: [
        'Processing time is approximately 90 business days.',
        'Embassy reserves the right to request further information or personal interview.'
    ],
    embassyWarnings: [
        'Passport expiry must be > 15 months from travel date.',
        'All documents must be color scanned and in original.',
        'Non-English documents must be translated by approved translators and notarized.'
    ]
}

export const BELARUS_STUDENT: VisaConfig = {
    steps: [
        COMMON_STEPS.PERSONAL_PROFILE,
        COMMON_STEPS.CONTACT_AND_FAMILY,
        {
            ...COMMON_STEPS.PROFESSIONAL_FINANCIAL,
            fields: [
                ...COMMON_STEPS.PROFESSIONAL_FINANCIAL.fields,
                { name: 'section_sponsor_details', label: '7. Sponsor / Financial Details', type: 'section-header', required: false },
                { name: 'sponsorName', label: 'Sponsor Name', type: 'text', required: true },
                { name: 'sponsorRelation', label: 'Relationship to Applicant', type: 'text', required: true },
                { name: 'sponsorOccupation', label: 'Sponsor Occupation', type: 'text', required: true },
                { name: 'sponsorIncome', label: 'Sponsor Annual Income', type: 'text', required: true },
            ]
        },
        {
            ...COMMON_STEPS.TRIP_ACCOMMODATION,
            fields: [
                ...COMMON_STEPS.TRIP_ACCOMMODATION.fields,
                { name: 'section_education_details', label: '10. Education Details', type: 'section-header', required: false },
                { name: 'universityName', label: 'University Name', type: 'text', required: true },
                { name: 'courseName', label: 'Course / Program', type: 'text', required: true },
                { name: 'courseDuration', label: 'Course Duration', type: 'text', required: true },
                { name: 'moiLanguage', label: 'Mode of Instruction Language', type: 'select', required: true, options: ['English', 'Russian', 'Belarusian', 'Other'] },
            ]
        },
        {
            ...COMMON_STEPS.BACKGROUND_HISTORY,
            fields: [
                ...COMMON_STEPS.BACKGROUND_HISTORY.fields,
                { name: 'section_medical_details', label: '12. Medical Details', type: 'section-header', required: false },
                { name: 'hivTestDate', label: 'HIV Test Date', type: 'date', required: true, className: "text-gray-600", helpText: 'Must not be older than 2 weeks.' },
                { name: 'medicalCertUpload', label: 'Original Medical Fitness Certificate (Upload Status)', type: 'select', required: true, options: ['Pending', 'Uploaded'] },
            ]
        },
        COMMON_STEPS.DECLARATION,
        COMMON_STEPS.REVIEW,
    ],
    documentsRequired: [
        { id: 'passport', name: 'Valid Passport', required: true },
        { id: 'photo', name: 'Photo 3.5x4.5', required: true },
        { id: 'marksheet10_12', name: '(Must be Appostiled from MEA) 10th and 12th Marksheets', required: true },
        { id: 'bachelorTranscript', name: '(Must be Appostiled from MEA) Bachelor transcript', infoLabel: 'single page, if applying for Masters', required: false },
        { id: 'insurance', name: 'Travel Insurance (valid for full duration of stay)', required: true },
        { id: 'medicalDocs', name: 'Medical certificate/Reports (inc. HIV)', infoLabel: 'HIV REPORTS ARE MUST FOR BELARUS STUDENT APPLICANTS', required: true },
        { id: 'bankStatement', name: 'Sponsor Bank Statement (6 months old)', required: true },
        { id: 'sponsorAffidavit', name: 'Sponsor Affidavit of Support', required: true, apostilleRequired: true },
        { id: 'selfReferenceVideo', name: 'Self-Reference Video (2-3 mins: intro, why Belarus, why course, future plans)', required: true },
        { id: 'applicantAadhar', name: 'Applicant\'s Aadhar', infoLabel: 'It must be notarized.', required: true, notarizationRequired: true },
        { id: 'sponsorAadhar', name: 'Sponsor\'s Aadhar', required: true, notarizationRequired: true },
        { id: 'pcc', name: 'Police Clearance Certificate (PCC)', infoLabel: 'MUST for Georgia student visa', required: false },
        { id: 'medicalCertOriginal', name: 'Original Medical Fitness Certificate (as per format)', required: true },
        { id: 'moi_ielts', name: 'MOI Letter from school OR IELTS score', infoLabel: 'MUST for Georgia student visa', required: false },
        { id: 'sponsorIncomeProof', name: 'Sponsor Proof of Income', infoLabel: 'MUST for Georgia student visa', required: false },
        { id: 'invitationDocs', name: 'ORIGINAL INVITATION/PERMIT;CONTRACT; ACCOMODATION LETTER; OTHERS FROM BELARUS BASED COMPANY', infoLabel: 'MUST for Belarus Work-permit category. Please upload all these docs (together/ merged) in a single pdf.', required: false },
        { id: 'flightDocs', name: 'Flight Itinerary/Reservation', required: false },
    ],
    processingTime: '~45 business days',
    fee: 'Excludes Embassy/Consulate fee(s). Your bank may charge forex/transaction fee.',
    notes: [
        'Processing time is approximately 45 business days.',
        'Estimated times only — Embassy/Consulate reserves the final rights.',
        'Time limit for submitting missing documents is 5 days only after notification.'
    ],
    embassyWarnings: [
        '⚠️ Time limit for submitting missing documents is 5 days only after notification.',
        'Medical reports must not be older than 2 weeks.',
        'All documents must be color scanned and in original.',
        'Non-English documents must be translated by approved translators and notarized.'
    ]
}
