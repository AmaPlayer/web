import React, { useRef, useState } from 'react';
import {
    ACCEPTED_VIDEO_FORMATS,
    ACCEPTED_VIDEO_EXTENSIONS,
    MAX_VIDEO_SIZE_MB,
    VIDEO_UPLOAD_ERRORS
} from '@features/events/utils/constants';

interface VideoUploadProps {
    onFileSelect: (file: File) => void;
    onFileRemove: () => void;
    currentFile?: File;
    maxSizeMB?: number;
    acceptedFormats?: string[];
    uploadProgress?: number;
    error?: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
    onFileSelect,
    onFileRemove,
    currentFile,
    maxSizeMB = MAX_VIDEO_SIZE_MB,
    acceptedFormats = [...ACCEPTED_VIDEO_FORMATS],
    uploadProgress,
    error
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [validationError, setValidationError] = useState<string>('');

    const validateFile = (file: File): boolean => {
        setValidationError('');

        // Check file type
        if (!acceptedFormats.some(format => format === file.type)) {
            setValidationError(VIDEO_UPLOAD_ERRORS.INVALID_FORMAT);
            return false;
        }

        // Check file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            setValidationError(VIDEO_UPLOAD_ERRORS.FILE_TOO_LARGE);
            return false;
        }

        return true;
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            if (validateFile(file)) {
                onFileSelect(file);
            }
        }
    };

    const handleRemove = () => {
        setValidationError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onFileRemove();
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const displayError = validationError || error;

    return (
        <div className="video-upload">
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_VIDEO_EXTENSIONS.join(',')}
                onChange={handleFileChange}
                className="video-upload-input"
                style={{ display: 'none' }}
                aria-label="Upload video file"
            />

            {!currentFile ? (
                <button
                    type="button"
                    onClick={handleButtonClick}
                    className="video-upload-button"
                    aria-label="Select video file"
                >
                    <span className="upload-icon" aria-hidden="true">📹</span>
                    <span>Upload Video</span>
                    <span className="upload-hint">
                        Max {maxSizeMB}MB • MP4, MOV, AVI, WEBM
                    </span>
                </button>
            ) : (
                <div className="video-upload-preview">
                    <div className="video-preview-info">
                        <span className="video-icon" aria-hidden="true">🎬</span>
                        <div className="video-details">
                            <p className="video-name">{currentFile.name}</p>
                            <p className="video-size">{formatFileSize(currentFile.size)}</p>
                        </div>
                    </div>

                    {uploadProgress !== undefined && uploadProgress < 100 && (
                        <div className="upload-progress" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <span className="progress-text">{uploadProgress}%</span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleRemove}
                        className="video-remove-button"
                        aria-label="Remove video file"
                    >
                        Remove
                    </button>
                </div>
            )}

            {displayError && (
                <div className="video-upload-error" role="alert" aria-live="assertive">
                    {displayError}
                </div>
            )}
        </div>
    );
};
