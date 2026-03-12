export type VisaConfig = {
    steps: StepConfig[]
    documentsRequired: DocumentItem[]
    processingTime: string
    fee: string
    notes: string[]
    embassyWarnings?: string[]
    flow?: ApplicationFlowConfig
    appointment?: AppointmentConfig
}

export type StepConfig = {
    id: string
    title: string
    fields: FieldConfig[]
}

export type FieldConfig = {
    name: string
    label: string
    type: 'text' | 'select' | 'date' | 'textarea' | 'number' | 'file' | 'radio' | 'checkbox' | 'email' | 'section-header'
    required: boolean
    options?: string[]
    placeholder?: string
    helpText?: string
    className?: string
    wrapperClassName?: string
    validation?: Record<string, unknown>
}

export type DocumentItem = {
    id: string
    name: string
    infoLabel?: string
    required: boolean
    notes?: string
    apostilleRequired?: boolean
    notarizationRequired?: boolean
}

export type DocumentUploadState = {
    [documentId: string]: {
        status: 'pending' | 'uploaded' | 'verified'
        fileName?: string
        fileSize?: number
        uploadedAt?: string
        dataUrl?: string  // base64 for preview (images/PDFs)
    }
}

export type ApplicationGatewayState = {
    purpose: string;
    destinationCountry: string;
    startedAt: string;
    configKey?: string;
}

export type ApplicationFormState = {
    currentStep: number;
    formData: Record<string, unknown>;
    prefilledFields?: string[];
    isSubmitted?: boolean;
    submittedAt?: string;
}

export type ApplicationFlowConfig = {
    requiresDocuments: boolean;
    requiresPayment: boolean;
    requiresAppointment: boolean;
    requirePaymentBeforeAppointment: boolean;
}

export type AppointmentSlotConfig = {
    id: string
    date: string
    time: string
    title?: string
}

export type AppointmentConfig = {
    instructions?: string
    slots: AppointmentSlotConfig[]
}
