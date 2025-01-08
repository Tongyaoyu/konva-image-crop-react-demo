import Konva from 'konva';
import React, { useEffect, useState, useRef } from 'react';
import { Image as KonvaImage } from 'react-konva';
import useTransformer from './useTransformer';


interface MyImageProps {
    image: HTMLImageElement;
    onSelect: () => void;
    transformer: ReturnType<typeof useTransformer>;
    onDoubleClick: () => void;
}


const MyImage: React.FC<MyImageProps> = ({ image, onSelect, transformer, onDoubleClick }) => {

    const [lastSize, setLastSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
    const [lastCrop, setLastCrop] = useState<{ x: number, y: number, width: number, height: number }>({ x: 0, y: 0, width: 0, height: 0 });


    const [data, setData] = useState<{ x: number; y: number; width: number; height: number }>({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });

    const imageRef = useRef<Konva.Image>(null);

    useEffect(() => {
        if (!image) return;
        if (!imageRef.current) return;

        const container = document.getElementById("container") as HTMLElement;
        if (!container) return;

        const padding = 12;
        const scaleX = (container.offsetWidth - padding * 2) / image.width;
        const scaleY = (container.offsetHeight - padding * 2) / image.height;

        let scale = Math.min(scaleX, scaleY);
        if (scale > 1) scale = 1;

        const width = image.width * scale;

        const height = image.height * scale;
        const x = container.offsetWidth / 2 - width / 2;
        const y = container.offsetHeight / 2 - height / 2;
        setData({
            x,
            y,
            width,
            height,
        });

        imageRef.current.cropWidth(image.width)
        imageRef.current.cropHeight(image.height)
        setLastCrop(imageRef.current.crop());
    }, [image]);

    const _handleTransformStart = () => {
        if (!imageRef.current) return;
        setLastSize(imageRef.current.size());
        setLastCrop(imageRef.current.crop());
    }

    const _handleTransform = (e: any) => {
        if (!imageRef.current) return;
        imageRef.current.setAttrs({
            scaleX: 1,
            scaleY: 1,
            width: imageRef.current.width() * imageRef.current.scaleX(),
            height: imageRef.current.height() * imageRef.current.scaleY(),
        });
        _handleCrop(imageRef.current.size(), transformer.transformerRef.current?.getActiveAnchor());
    }

    const _handleTransformEnd = () => {
        if (!imageRef.current) return;
        setLastSize({ width: 0, height: 0 });
        setLastCrop({ x: 0, y: 0, width: 0, height: 0 });
    }

    const _handleCrop = (curSize: any, anchor: any) => {
        let ratio;
        let newCropWidth = lastCrop.width;
        let newCropHeight = lastCrop.height;
        if (!imageRef.current) return;


        if (anchor === "middle-left" || anchor === "middle-right") {
            if (curSize.width < lastSize.width) {
                ratio = curSize.width / lastSize.width;
                newCropWidth = lastCrop.width * ratio;

                // 参考的代码中，middle-left的anchor一直往右边拉，当和middle-right重合继续拉之后，activeAnchor还是middle-left
                // 而react中不一样，会变成middle-right
                // 这里的逻辑不一样，参考代码会有白边
                imageRef.current.cropWidth(newCropWidth);
            } else {
                ratio = lastCrop.height / lastSize.height;
                newCropWidth = curSize.width * ratio;

                if (newCropWidth > image.width - lastCrop.x) {
                    ratio = (image.width - lastCrop.x) / curSize.width;
                    newCropHeight = curSize.height * ratio;
                    imageRef.current.cropHeight(newCropHeight);
                } else {
                    imageRef.current.cropWidth(newCropWidth);
                }
            }
        } else if (anchor === "top-center" || anchor === "bottom-center") {
            if (curSize.height < lastSize.height) {
                ratio = curSize.height / lastSize.height;
                newCropHeight = lastCrop.height * ratio;
                imageRef.current.cropHeight(newCropHeight);
            } else {
                ratio = lastCrop.width / lastSize.width;
                newCropHeight = curSize.height * ratio;
                if (newCropHeight > image.height - lastCrop.y) {
                    ratio = (image.height - lastCrop.y) / curSize.height;
                    newCropWidth = curSize.width * ratio;
                    imageRef.current.cropWidth(newCropWidth);
                } else {
                    imageRef.current.cropHeight(newCropHeight);
                }
            }
        }
    }

    return (
        <>
            <KonvaImage
                image={image}
                x={data.x}
                y={data.y}
                width={data.width}
                height={data.height}
                ref={imageRef}
                onClick={onSelect}
                onDblClick={onDoubleClick}
                onTransformStart={_handleTransformStart}
                onTransform={_handleTransform}
                onTransformEnd={_handleTransformEnd}
                draggable
            />
        </>
    );
};

export default MyImage;