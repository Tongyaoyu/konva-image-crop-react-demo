import React, { useState, useRef, useCallback } from "react";
import { Stage, Layer, Transformer } from "react-konva";
import MyImage from "./components/MyImage";
import CropScene from "./components/CropScene";
import useTransformer from "./components/useTransformer";
import { KonvaEventObject } from "konva/lib/Node";

const App = () => {
  const [images, setImages] = useState<HTMLImageElement[]>([]); // Store multiple images
  const [isCropping, setIsCropping] = useState(false);
  const stageRef = useRef(null);
  const transformer = useTransformer();
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: HTMLImageElement[] = [];
    if (!transformer.transformerRef.current) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.src = objectUrl;

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        newImages.push(img);
        if (newImages.length === files.length) {
          setImages(prevImages => {
            const updatedImages = [...prevImages, ...newImages];
            return updatedImages;
          });
        }
      };
    }
  };

  const handleDoubleClick = () => {
    setIsCropping(true);
  };

  const cropDone = () => {
    setIsCropping(false)
  }

  const onSelect = (e?: KonvaEventObject<MouseEvent>) => {
    if (!e) return;
    if (!transformer.transformerRef.current) {
      return;
    }
    console.log()
    if (e.target.getType() === "Stage") {
      transformer.transformerRef.current.nodes([]);
      return;
    }
    const targetItem = e.target;
    transformer.transformerRef.current.nodes([targetItem]);
    return;
  }

  const onSelectEmptyBackground = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      e.target.getType() === "Stage" && onSelect(e);
    },
    [onSelect],
  );

  return (
    <div className="flex flex-col items-center p-2">
      <input
        className="mb-4 p-2 bg-blue-500 text-white"
        type="file"
        id="image-upload"
        accept="image/*"
        onChange={handleImageUpload}
        multiple 
      />
      <div id="container" className="border border-slate-400 w-[800px] h-[600px]">
        <Stage width={800} height={600} ref={stageRef} onMouseDown={onSelectEmptyBackground}>
          <Layer>
            {images.map((image, index) => (
              <MyImage
                key={index}
                image={image}
                transformer={transformer}
                onSelect={onSelect}
                onDoubleClick={handleDoubleClick}
              />
            ))}
            {isCropping ?
              <CropScene
                stage={stageRef}
                transformer={transformer}
                cropDone={cropDone}
              /> : null
            }
            <Transformer
              ref={transformer.transformerRef}
              flipEnabled={false}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default App;