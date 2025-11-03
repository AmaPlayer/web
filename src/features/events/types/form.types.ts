export interface FormErrors {
  title?: string;
  description?: string;
  sport?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  videoFile?: string;
}

export interface FormState {
  title: string;
  description: string;
  sport: string;
  location: string;
  startDate: Date | null;
  endDate: Date | null;
  videoFile: File | null;
  errors: FormErrors;
  isSubmitting: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
