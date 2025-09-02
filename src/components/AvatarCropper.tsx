"use client";

import { useState, useRef, useEffect, MouseEvent, WheelEvent } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Define the props for our component
interface AvatarCropperProps {
  isOpen: boolean;
  onClose: () => void;
  image: File | null;
  onSave: (file: File) => void;
}

// Define the state for our image position and scale
interface ImageState {
  x: number;
  y: number;
  scale: number;
}

const CROP_DIMENSION = 300; // The width and height of the circular crop area
const CANVAS_DIMENSION = 400; // The width and height of the canvas editor itself

export default function AvatarCropper({
  isOpen,
  onClose,
  image,
  onSave,
}: AvatarCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null
  );
  const [imageState, setImageState] = useState<ImageState>({
    x: 0.5,
    y: 0.5,
    scale: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
    imageX: 0,
    imageY: 0,
  });
  const animationRef = useRef<number | null>(null);

  // Step 1: Load the selected image file into an HTMLImageElement
  useEffect(() => {
    if (image) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          setImageElement(img);
          // Set initial state to fit the image naturally
          const initialState = getInitialImageState(img.width, img.height);
          setImageState(initialState);
        };
      };
      reader.readAsDataURL(image);
    }
  }, [image]);

  const getInitialImageState = (
    imgWidth: number,
    imgHeight: number
  ): ImageState => {
    // Calculate scale to fit the smaller dimension to the crop area
    // This ensures the entire crop circle can be filled without excessive zooming
    const scaleToFit = Math.min(
      CANVAS_DIMENSION / imgWidth,
      CANVAS_DIMENSION / imgHeight
    );

    // Don't zoom in by default - just fit naturally
    const initialScale = Math.min(scaleToFit, 1);

    return {
      x: 0.5,
      y: 0.5,
      scale: initialScale,
    };
  };

  // Step 2: The core drawing logic
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !imageElement) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scaled image dimensions
    const scaledWidth = imageElement.width * imageState.scale;
    const scaledHeight = imageElement.height * imageState.scale;

    // Calculate the top-left corner of the image
    const x = imageState.x * CANVAS_DIMENSION - scaledWidth / 2;
    const y = imageState.y * CANVAS_DIMENSION - scaledHeight / 2;

    // Draw the image
    ctx.drawImage(imageElement, x, y, scaledWidth, scaledHeight);

    // Draw the circular overlay (darken everything outside the circle)
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.arc(
      CANVAS_DIMENSION / 2,
      CANVAS_DIMENSION / 2,
      CROP_DIMENSION / 2,
      0,
      Math.PI * 2,
      true
    );
    ctx.fill();

    // Draw crop circle border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      CANVAS_DIMENSION / 2,
      CANVAS_DIMENSION / 2,
      CROP_DIMENSION / 2,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  };

  useEffect(() => {
    drawCanvas();
  }, [imageElement, imageState]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Step 3: Handle mouse events for panning
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      imageX: imageState.x,
      imageY: imageState.y,
    });
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const dx = (e.clientX - dragStart.x) / CANVAS_DIMENSION;
    const dy = (e.clientY - dragStart.y) / CANVAS_DIMENSION;

    setImageState((prev) => ({
      ...prev,
      x: dragStart.imageX + dx,
      y: dragStart.imageY + dy,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Step 4: Smooth mouse wheel zoom with throttling
  const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
    // Note: preventDefault is handled by touchAction: 'none' CSS property

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Very small delta for ultra-smooth scrolling
    const delta = e.deltaY > 0 ? -0.02 : 0.02;
    const minScale = 0.1;
    const maxScale = 3;

    animationRef.current = requestAnimationFrame(() => {
      setImageState((prev) => {
        const newScale = Math.max(
          minScale,
          Math.min(maxScale, prev.scale + delta)
        );
        return {
          ...prev,
          scale: newScale,
        };
      });
    });
  };

  // Step 5: Handle zoom slider
  const handleZoomChange = (value: number[]) => {
    setImageState((prev) => ({ ...prev, scale: value[0] }));
  };

  // Step 6: Save the cropped image
  const handleSave = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !imageElement) return;

    // Create a temporary canvas for the cropped result
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = CROP_DIMENSION;
    tempCanvas.height = CROP_DIMENSION;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Calculate scaled dimensions and positions
    const scaledWidth = imageElement.width * imageState.scale;
    const scaledHeight = imageElement.height * imageState.scale;

    // Calculate the crop area relative to the canvas center
    const cropX = CANVAS_DIMENSION / 2 - CROP_DIMENSION / 2;
    const cropY = CANVAS_DIMENSION / 2 - CROP_DIMENSION / 2;

    // Draw the cropped portion
    tempCtx.drawImage(
      canvas,
      cropX,
      cropY,
      CROP_DIMENSION,
      CROP_DIMENSION,
      0,
      0,
      CROP_DIMENSION,
      CROP_DIMENSION
    );

    // Create circular mask
    tempCtx.globalCompositeOperation = "destination-in";
    tempCtx.beginPath();
    tempCtx.arc(
      CROP_DIMENSION / 2,
      CROP_DIMENSION / 2,
      CROP_DIMENSION / 2,
      0,
      Math.PI * 2
    );
    tempCtx.fill();

    // Convert to file
    tempCanvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], image?.name || "avatar.png", {
            type: image?.type || "image/png",
          });
          onSave(croppedFile);
          onClose();
        }
      },
      image?.type || "image/png",
      0.9
    );
  };

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crop Photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas */}
          <div className="flex justify-center bg-muted rounded-lg p-4">
            <canvas
              ref={canvasRef}
              width={CANVAS_DIMENSION}
              height={CANVAS_DIMENSION}
              className={`rounded border transition-all duration-75 ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{ touchAction: "none" }}
            />
          </div>

          {/* Zoom Control */}
          <div className="px-2">
            <Slider
              min={0.1}
              max={3}
              step={0.05}
              value={[imageState.scale]}
              onValueChange={handleZoomChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Zoom out</span>
              <span>Zoom in</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
