import React, { useState } from 'react';
import { X, Check, RotateCw } from 'lucide-react';
import './ProfilePictureCropper.css';

interface ProfilePictureCropperProps {
  imageSrc: string;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  outputWidth?: number;
  outputHeight?: number;
}

const ProfilePictureCropper: React.FC<ProfilePictureCropperProps> = ({
  imageSrc,
  onCrop,
  onCancel,
  aspectRatio = 1,
  outputWidth = 400,
  outputHeight = 400
}) => {
  const [rotation, setRotation] = useState(0);

  const handleCrop = async () => {
    // This is a placeholder implementation
    // In a real app, you would use a library like react-image-crop or react-cropper
    try {
      // Create a canvas to simulate cropping
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        
        // Draw the image (this is simplified - real cropping would be more complex)
        ctx?.drawImage(img, 0, 0, outputWidth, outputHeight);
        
        canvas.toBlob((blob) => {
          if (blob) {
            onCrop(blob);
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.src = imageSrc;
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Error cropping image. Please try again.');
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className="cropper-modal">
      <div className="cropper-overlay" onClick={onCancel}></div>
      <div className="cropper-container">
        <div className="cropper-header">
          <h3>Crop Profile Picture</h3>
          <button className="cropper-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        
        <div className="cropper-content">
          <div className="cropper-image-container">
            <img 
              src={imageSrc} 
              alt="Crop preview" 
              className="cropper-image"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            <div className="crop-overlay">
              <div className="crop-area"></div>
            </div>
          </div>
          
          <div className="cropper-controls">
            <button className="cropper-btn secondary" onClick={handleRotate}>
              <RotateCw size={16} />
              Rotate
            </button>
          </div>
        </div>
        
        <div className="cropper-footer">
          <button className="cropper-btn secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="cropper-btn primary" onClick={handleCrop}>
            <Check size={16} />
            Crop & Save
          </button>
        </div>
      </div>
      

    </div>
  );
};

export default ProfilePictureCropper;