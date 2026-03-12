import { StepConfig } from '@/types/visa';

// Consolidated 7-step architecture for Visa Applications
export const COMMON_STEPS: Record<string, StepConfig> = {
    PERSONAL_PROFILE: {
        id: 'personal-profile',
        title: 'Personal Profile',
        fields: [
            { name: 'section_visa_details', label: '1. Visa Details', type: 'section-header', required: false },
            // Destination country and purpose / visa type are already captured in the gateway step.
            // Here we only ask for number of entries and keep the rest read-only in the header.
            { name: 'numberOfEntries', label: 'Number of Entries', type: 'select', required: true, options: ['Single', 'Double', 'Multiple'] },

            { name: 'section_personal_info', label: '2. Personal Information', type: 'section-header', required: false },
            { name: 'lastName', label: 'Last Name (as per passport)', type: 'text', required: true, placeholder: 'Surname' },
            { name: 'firstName', label: 'First Name (as per passport)', type: 'text', required: true, placeholder: 'Given name' },
            { name: 'middleName', label: 'Other / Middle Name (if any)', type: 'text', required: false },
            { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
            { name: 'maritalStatus', label: 'Marital Status', type: 'select', required: true, options: ['Single', 'Married', 'Divorced', 'Widowed'] },
            { name: 'dob', label: 'Date of Birth', type: 'date', required: true, className: 'text-gray-600' },
            { name: 'placeOfBirth', label: 'Place of Birth (City, State)', type: 'text', required: true, placeholder: 'City, State' },
            { name: 'countryOfBirth', label: 'Country of Birth', type: 'text', required: true },
            { name: 'nationality', label: 'Nationality', type: 'text', required: true, placeholder: 'e.g. Indian' },
            { name: 'nationalIdNumber', label: 'National ID Number (if applicable)', type: 'text', required: false },

            { name: 'section_passport_details', label: '3. Passport / Travel Document Details', type: 'section-header', required: false },
            { name: 'passportType', label: 'Passport Type', type: 'select', required: true, options: ['Ordinary', 'Official', 'Diplomatic', 'Other'] },
            { name: 'passportNumber', label: 'Passport Number', type: 'text', required: true, placeholder: 'T9039525' },
            { name: 'passportIssueDate', label: 'Date of Issue', type: 'date', required: true, className: 'text-gray-600' },
            { name: 'passportExpiryDate', label: 'Date of Expiry', type: 'date', required: true, className: 'text-gray-600', validation: { minMonthsFromTravel: 6 } },
            { name: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: true },
            { name: 'issuingCountry', label: 'Issuing Country', type: 'text', required: true }
        ]
    },
    CONTACT_AND_FAMILY: {
        id: 'contact-family',
        title: 'Contact & Family',
        fields: [
            { name: 'section_contact_details', label: '4. Contact Information', type: 'section-header', required: false },
            { name: 'residentialCountry', label: 'Residential Country', type: 'text', required: true },
            { name: 'residentialState', label: 'State', type: 'text', required: true },
            { name: 'residentialCity', label: 'City / Town', type: 'text', required: true },
            { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },
            { name: 'fullAddress', label: 'Full Residential Address', type: 'textarea', required: true, wrapperClassName: 'sm:col-span-2' },
            { name: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true, placeholder: '+995 593 011 020' },
            { name: 'email', label: 'Email Address', type: 'text', required: true, placeholder: 'name@example.com' },
            { name: 'residingInOtherCountry', label: 'Are you residing in a country other than your nationality?', type: 'select', required: true, options: ['No', 'Yes'] },
            { name: 'residencePermitNumber', label: 'Residence Permit Number (if applicable)', type: 'text', required: false },
            { name: 'residencePermitValidUntil', label: 'Residence Permit Valid Until', type: 'date', required: false, className: 'text-gray-600' },

            { name: 'section_emergency_contact', label: '5. Emergency Contact Details', type: 'section-header', required: false },
            { name: 'emergencyName', label: 'Emergency Contact Full Name', type: 'text', required: true },
            { name: 'emergencyRelation', label: 'Relationship to Applicant', type: 'text', required: true },
            { name: 'emergencyPhone', label: 'Emergency Contact Phone Number', type: 'text', required: true },
            { name: 'emergencyEmail', label: 'Emergency Contact Email Address', type: 'text', required: false },
            { name: 'emergencyAddress', label: 'Emergency Contact Address', type: 'textarea', required: false, wrapperClassName: 'sm:col-span-2' },

            { name: 'section_family_info', label: '12. Family Information', type: 'section-header', required: false },
            { name: 'fatherFullName', label: 'Father’s Full Name', type: 'text', required: false, wrapperClassName: 'sm:col-span-2' },
            { name: 'motherFullName', label: 'Mother’s Full Name', type: 'text', required: false, wrapperClassName: 'sm:col-span-2' },
            { name: 'spouseName', label: 'Spouse Name (if married)', type: 'text', required: false, wrapperClassName: 'sm:col-span-2' },
            { name: 'childrenDetails', label: 'Children Details (if any)', type: 'textarea', required: false, wrapperClassName: 'sm:col-span-2', helpText: 'Include full name and date of birth for each child.' },

            { name: 'section_accompanying', label: '13. Accompanying Persons', type: 'section-header', required: false },
            { name: 'accompanyingPersons', label: 'If traveling with family, list names, relationships, and passport numbers', type: 'textarea', required: false, wrapperClassName: 'sm:col-span-2' }
        ]
    },
    PROFESSIONAL_FINANCIAL: {
        id: 'professional-financial',
        title: 'Professional & Financial',
        fields: [
            { name: 'section_employment', label: '6. Employment / Financial Information', type: 'section-header', required: false },
            { name: 'currentOccupation', label: 'Current Occupation', type: 'text', required: true },
            { name: 'employerName', label: 'Employer Name', type: 'text', required: false },
            { name: 'employerPosition', label: 'Your Position / Job Title', type: 'text', required: false },
            { name: 'employerAddress', label: 'Employer Address', type: 'textarea', required: false, wrapperClassName: 'sm:col-span-2' },
            { name: 'employerPhone', label: 'Employer Phone Number', type: 'text', required: false },
            { name: 'employerEmail', label: 'Employer Email', type: 'text', required: false },
            { name: 'incomePeriod', label: 'Income Period', type: 'select', required: false, options: ['Monthly', 'Annual'] },
            { name: 'incomeAmount', label: 'Income Amount', type: 'text', required: false },
            { name: 'sourceOfIncome', label: 'Source of Income', type: 'select', required: true, options: ['Self', 'Employer', 'Sponsor', 'Other'] },
            { name: 'sourceOfIncomeOther', label: 'If Other, please specify', type: 'text', required: false },
            { name: 'isSponsored', label: 'Is your trip sponsored?', type: 'select', required: true, options: ['No', 'Yes'] },
            { name: 'sponsorName', label: 'Sponsor Name', type: 'text', required: false },
            { name: 'sponsorRelationship', label: 'Relationship with Sponsor', type: 'text', required: false },
            { name: 'affidavitOfSupportAttached', label: 'Affidavit of Support attached (for sponsored cases)', type: 'select', required: false, options: ['No', 'Yes'] },
            { name: 'amountOfIncome', label: 'Amount of income / funds available (currency + amount)', type: 'text', required: false }
            // Note: additional sponsor‑specific fields can still be appended by visaConfigs (e.g. for students)
        ]
    },
    TRIP_ACCOMMODATION: {
        id: 'trip-accommodation',
        title: 'Trip & Accommodation',
        fields: [
            { name: 'section_travel_info', label: '7. Travel Information', type: 'section-header', required: false },
            { name: 'purposeOfTravel', label: 'Purpose of Travel', type: 'text', required: true, placeholder: 'Study / Tourism / Business / Work' },
            { name: 'durationOfStayMonths', label: 'Duration of Stay (Months)', type: 'number', required: true },
            { name: 'arrivalDate', label: 'Intended Date of Arrival', type: 'date', required: true, className: 'text-gray-600' },
            { name: 'departureDate', label: 'Intended Date of Departure', type: 'date', required: true, className: 'text-gray-600' },

            { name: 'section_invitation', label: '8. Invitation Details (If Applicable)', type: 'section-header', required: false },
            { name: 'invitationProvided', label: 'Is invitation provided?', type: 'select', required: true, options: ['No', 'Yes'] },
            { name: 'invitationNumber', label: 'Invitation Number', type: 'text', required: false },
            { name: 'invitingOrganizationName', label: 'Inviting Organization Name', type: 'text', required: false, wrapperClassName: 'sm:col-span-2' },
            { name: 'invitingContactDetails', label: 'Inviting Organization Contact Details', type: 'textarea', required: false, wrapperClassName: 'sm:col-span-2' },

            { name: 'section_accommodation', label: '9. Accommodation Details During Stay', type: 'section-header', required: false },
            { name: 'accommodationType', label: 'Accommodation Type', type: 'select', required: true, options: ['Hostel', 'Hotel', 'Private Residence'] },
            { name: 'accommodationName', label: 'Name of Place', type: 'text', required: true },
            { name: 'accommodationAddress', label: 'Full Address', type: 'textarea', required: true, wrapperClassName: 'sm:col-span-2' },
            { name: 'accommodationPhone', label: 'Contact Number', type: 'text', required: false },
            { name: 'reservationAttached', label: 'Reservation Attached?', type: 'select', required: true, options: ['No', 'Yes'] }
        ]
    },
    BACKGROUND_HISTORY: {
        id: 'background-history',
        title: 'Background & Security',
        fields: [
            { name: 'section_travel_history', label: '10. Travel History', type: 'section-header', required: false },
            { name: 'visitedDestinationBefore', label: 'Have you visited this destination country before?', type: 'select', required: true, options: ['No', 'Yes'] },
            { name: 'previousVisitDates', label: 'If yes, provide date(s)', type: 'textarea', required: false, wrapperClassName: 'sm:col-span-2' },
            { name: 'previousVisitPurpose', label: 'Purpose of previous visit(s)', type: 'textarea', required: false, wrapperClassName: 'sm:col-span-2' },
            { name: 'countriesVisitedLastYear', label: 'Countries visited in the last 1 year', type: 'textarea', required: false, wrapperClassName: 'sm:col-span-2' },
            { name: 'hasSchengenOrSimilarVisa', label: 'Do you have a valid USA / EU / Schengen multiple-entry visa that has been used at least once?', type: 'select', required: false, options: ['No', 'Yes'] },
            { name: 'schengenVisaDetails', label: 'If yes, provide visa type, country and validity dates', type: 'textarea', required: false, wrapperClassName: 'sm:col-span-2' },
            { name: 'hasResidencePermitAnyCountry', label: 'Do you have a residence permit of any country?', type: 'select', required: false, options: ['No', 'Yes'] },
            { name: 'residencePermitAnyCountryDetails', label: 'If yes, provide country, permit number and validity', type: 'textarea', required: false, wrapperClassName: 'sm:col-span-2' },
            { name: 'visaRefusedBefore', label: 'Have you ever been refused a visa?', type: 'select', required: true, options: ['No', 'Yes'] },
            { name: 'visaRefusalCountry', label: 'If yes, country', type: 'text', required: false },
            { name: 'visaRefusalDate', label: 'Date of refusal', type: 'date', required: false, className: 'text-gray-600' },
            { name: 'visaRefusalReason', label: 'Reason for refusal', type: 'textarea', required: false, wrapperClassName: 'sm:col-span-2' },

            { name: 'section_security', label: '11. Background & Security Questions', type: 'section-header', required: false },
            { name: 'criminalOffense', label: 'Have you ever been convicted of any criminal offense?', type: 'select', required: true, options: ['No', 'Yes'] },
            { name: 'communicableDisease', label: 'Do you have any communicable disease of public health concern?', type: 'select', required: true, options: ['No', 'Yes'] },
            { name: 'backgroundSecurityDetails', label: 'If yes to any, provide details', type: 'textarea', required: false, wrapperClassName: 'sm:col-span-2' }
        ]
    },
    DECLARATION: {
        id: 'declaration',
        title: 'Declaration',
        fields: [
            {
                name: 'section_declaration',
                label: '15. Declaration',
                type: 'section-header',
                required: false,
                helpText:
                    'I hereby declare that all information and documents provided in this application are true, complete and accurate. I understand that providing false or forged information may lead to visa refusal. I have sufficient funds to cover my stay, will comply with all conditions of entry and stay in the destination country, and I am aware that consular / VFS fees and GGBA professional service fees are non‑refundable. I may be called for an interview and I consent to the processing of my personal and biometric data for visa purposes.'
            },
            { name: 'acceptTerms', label: 'I have read and accept the above Terms & Conditions.', type: 'checkbox', required: true, wrapperClassName: 'sm:col-span-2' },
            { name: 'uploadedDocumentsConfirmed', label: 'I confirm that I have uploaded all required supporting documents as per the checklist.', type: 'checkbox', required: true, wrapperClassName: 'sm:col-span-2' },
            { name: 'declarationPlace', label: 'Place', type: 'text', required: true },
            { name: 'declarationDate', label: 'Date', type: 'date', required: true, className: 'text-gray-600' },
            { name: 'declarationSignature', label: 'Signature (type your full name)', type: 'text', required: true, wrapperClassName: 'sm:col-span-2' }
        ]
    },
    REVIEW: {
        id: 'review',
        title: 'Review & Submit',
        fields: [] // Custom component handles this
    }
};
