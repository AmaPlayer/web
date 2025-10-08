import React, { useState, useRef, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import { X, Check, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import './CoverPhotoCropper.css';

interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragState {
  x: number;
  y: number;
}

interface CoverPhotoCropperProps {
  imageSrc: string;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  outputWidth?: number;
  outputHeight?: number;
}

const CoverPhotoCropper: React.FC<CoverPhotoCropperProps> = ({ 
  imageSrc, 
  onCrop, 
  onCancel, 
  aspectRatio = 8/3,
  outputWidth = 800,
  outputHeight = 300
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<CropState>({
    x: 0,
    y: 0,
    width: 100,
    height: 100 / aspectRatio
  });
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<DragState>({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - crop.x,
      y: e.clientY - crop.y
    });
  }, [crop]);

  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    setCrop(prev => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.width, newX)),
      y: Math.max(0, Math.min(100 - prev.height, newY))
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleScaleChange = (newScale: number) => {
    setScale(Math.max(0.5, Math.min(3, newScale)));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const getCroppedImage = useCallback((): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image) return Promise.resolve(null);

    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const scaleX = image.naturalWidth / 100;
    const scaleY = image.naturalHeight / 100;
    
    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceWidth = crop.width * scaleX;
    const sourceHeight = crop.height * scaleY;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  }, [crop, scale, rotation, outputWidth, outputHeight]);

  const handleCrop = async () => {
    const croppedBlob = await getCroppedImage();
    if (croppedBlob) {
      onCrop(croppedBlob);
    }
  };

  return (
    <div className="cover-photo-cropper-overlay">
      <div className="cover-photo-cropper-modal">
        <div className="cropper-header">
          <h3>Adjust Cover Photo</h3>
          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="cropper-content">
          <div 
            className="image-container"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              className="crop-image"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`
              }}
            />
            
            <div
              className="crop-area"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`
              }}
              onMouseDown={handleMouseDown}
            >
              <div className="crop-overlay"></div>
              <div className="crop-handle"></div>
            </div>
          </div>

          <div className="cropper-controls">
            <div className="control-group">
              <label>Zoom</label>
              <div className="zoom-controls">
                <button onClick={() => handleScaleChange(scale - 0.1)}>
                  <ZoomOut size={16} />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                />
                <button onClick={() => handleScaleChange(scale + 0.1)}>
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>

            <div className="control-group">
              <button className="rotate-btn" onClick={handleRotate}>
                <RotateCw size={16} />
                Rotate
              </button>
            </div>
          </div>
        </div>

        <div className="cropper-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="crop-btn" onClick={handleCrop}>
            <Check size={16} />
            Apply
          </button>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default CoverPhotoCropper;
