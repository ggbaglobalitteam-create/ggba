import { DocumentUploadState } from '@/types/visa';
import { applicationService } from './applicationService';

type ApiDocumentStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';

type ApiDocument = {
    documentId: string;
    status?: ApiDocumentStatus | string | null;
    name?: string | null;
    updatedAt?: string | null;
    createdAt?: string | null;
    fileUrl?: string | null;
};

function normalizeStatus(status?: ApiDocumentStatus | string | null): 'pending' | 'uploaded' | 'verified' {
    const value = String(status || 'PENDING').toUpperCase();
    if (value === 'UPLOADED') return 'uploaded';
    if (value === 'VERIFIED') return 'verified';
    return 'pending';
}

async function getCurrentApplicationId(): Promise<string | null> {
    const selected = applicationService.getCurrentApplicationId();
    if (selected) return selected;

    const list = await applicationService.listApplications().catch(() => []);
    const first = Array.isArray(list) ? list[0] : null;
    if (first?.id) {
        applicationService.setCurrentApplicationId(first.id);
        return first.id;
    }
    return null;
}

export const documentService = {
    getDocuments: async (applicationId?: string): Promise<DocumentUploadState> => {
        const id = applicationId || await getCurrentApplicationId();
        if (!id) return {};
        const res = await fetch(`/api/applications/${encodeURIComponent(id)}`);
        if (!res.ok) return {};
        const app = await res.json().catch(() => ({}));
        const docs: ApiDocument[] = Array.isArray(app?.documents) ? app.documents : [];
        const mapped: DocumentUploadState = {};
        for (const d of docs) {
            mapped[d.documentId] = {
                status: normalizeStatus(d.status),
                fileName: d.name || undefined,
                fileSize: undefined,
                uploadedAt: d.updatedAt || d.createdAt || undefined,
                dataUrl: d.fileUrl || undefined,
            };
        }
        return mapped;
    },

    getDocumentStatus: async (docId: string, applicationId?: string) => {
        const docs = await documentService.getDocuments(applicationId);
        return docs[docId];
    },

    uploadDocument: async (
        docId: string,
        fileData: { fileName: string, fileSize: number, file: File },
        applicationId?: string,
        displayName?: string
    ) => {
        const id = applicationId || await getCurrentApplicationId();
        if (!id) throw new Error('No active application');

        const fd = new FormData();
        fd.set('documentId', docId);
        fd.set('name', displayName || fileData.fileName);
        fd.set('file', fileData.file);

        const res = await fetch(`/api/applications/${encodeURIComponent(id)}/documents`, {
            method: 'POST',
            body: fd,
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.error || 'Upload failed');
        }
        const saved = await res.json().catch(() => ({}));

        return {
            status: 'uploaded',
            fileName: saved?.name || displayName || fileData.fileName,
            fileSize: fileData.fileSize,
            uploadedAt: saved?.updatedAt || new Date().toISOString(),
            dataUrl: saved?.fileUrl || undefined,
        };
    },

    updateDocumentStatus: async (docId: string, status: 'pending' | 'uploaded' | 'verified', applicationId?: string) => {
        // Applicant-side status updates are server-controlled by agent/admin verification.
        void docId;
        void status;
        void applicationId;
    },

    removeDocument: async (docId: string, applicationId?: string): Promise<void> => {
        // Delete endpoint not implemented yet; for now, set to pending by updating DB status via admin later.
        // Client can simply hide the local UI state.
        void docId;
        void applicationId;
    },

    clearDocuments: async (applicationId?: string): Promise<void> => {
        void applicationId;
    }
};
