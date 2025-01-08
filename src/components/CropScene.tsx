import React, { useEffect, useRef } from "react";
import Konva from 'konva';
import { Rect, Transformer, Image as KonvaImage, Group } from "react-konva";
import useTransformer from "./useTransformer";
import { KonvaEventObject } from "konva/lib/Node";

interface CropSceneProps {
    stage: React.RefObject<Konva.Stage>
    transformer: ReturnType<typeof useTransformer>;
    cropDone: () => void;
}

const CropScene: React.FC<CropSceneProps> = ({ stage, transformer, cropDone }) => {
    const _cropTransformerRef = useRef<Konva.Transformer>(null);
    const _scaleTransformerRef = useRef<Konva.Transformer>(null);
    const groupRef = useRef<Konva.Group>(null);
    const _cropGroupRef = useRef<Konva.Group>(null);
    const _clipGroupRef = useRef<Konva.Group>(null);
    const _maskRectRef = useRef<Konva.Rect>(null);
    const _clipRectRef = useRef<Konva.Rect>(null);
    const _clipImageRef = useRef<Konva.Image>(null);
    const _originImageRef = useRef<Konva.Image>(null);

    const _handleDrag = () => {
        if (!_clipImageRef.current || !_originImageRef.current || !_clipRectRef.current || !_cropGroupRef.current
            || !_clipGroupRef.current || !_cropTransformerRef.current || !_scaleTransformerRef.current
        ) return;
        let x = _clipRectRef.current.x();
        let y = _clipRectRef.current.y();
        let width = _clipRectRef.current.width();
        let height = _clipRectRef.current.height();
        const originWidth = _originImageRef.current.width();
        const originHeight = _originImageRef.current.height();

        if (x < 0) {
            x = 0;
        }
        if (x + width > originWidth) {
            x = originWidth - width;
            width = originWidth - x;
        }
        if (y < 0) {
            y = 0;
        }
        if (y + height > originHeight) {
            y = originHeight - height;
            height = originHeight - y;
        }

        _clipRectRef.current.setAttrs({
            x,
            y,
            width,
            height,
        });
        _clipGroupRef.current.clip({
            x,
            y,
            width,
            height,
        });
    }

    const _handleScale = () => {
        if (!_clipImageRef.current || !_originImageRef.current || !_clipRectRef.current || !_cropGroupRef.current
            || !_clipGroupRef.current || !_cropTransformerRef.current || !_scaleTransformerRef.current
        ) return;

        const originImage = _originImageRef.current;

        const scaleX = originImage.scaleX();
        const scaleY = originImage.scaleY();
        const width = originImage.width() * scaleX;
        const height = originImage.height() * scaleY;

        const rectAbspos = _clipRectRef.current.absolutePosition();
        const imageAbsPos = _cropGroupRef.current.absolutePosition();

        _cropGroupRef.current.absolutePosition(originImage.absolutePosition());
        _clipRectRef.current.absolutePosition(rectAbspos);
        if (
            _clipRectRef.current.x() <= 0 ||
            _clipRectRef.current.y() <= 0 ||
            _clipRectRef.current.x() + _clipRectRef.current.width() >= width ||
            _clipRectRef.current.y() + _clipRectRef.current.height() >= height
        ) {
            _cropGroupRef.current.absolutePosition(imageAbsPos);
            _clipRectRef.current.absolutePosition(rectAbspos);
            _originImageRef.current.setAttrs({
                width: _clipImageRef.current.width(),
                height: _clipImageRef.current.height(),
                scaleX: 1,
                scaleY: 1,
                absolutePosition: imageAbsPos,
            });
        } else {
            originImage.setAttrs({
                scaleX: 1,
                scaleY: 1,
                width,
                height,
            });
            _clipImageRef.current.setAttrs({
                width,
                height,
            });
        }
        const x = _clipRectRef.current.x();
        const y = _clipRectRef.current.y();
        _clipGroupRef.current.clipX(x);
        _clipGroupRef.current.clipY(y);
    }

    const _handleCrop = () => {
        if (!_clipImageRef.current || !_originImageRef.current || !_clipRectRef.current || !_cropGroupRef.current
            || !_clipGroupRef.current || !_cropTransformerRef.current || !_scaleTransformerRef.current
        ) return;

        let x = _clipRectRef.current.x();
        let y = _clipRectRef.current.y();
        let width = _clipRectRef.current.width() * _clipRectRef.current.scaleX();
        let height = _clipRectRef.current.height() * _clipRectRef.current.scaleY();
        if (x < 0) {
            width += x;
            x = 0;
        }
        if (x + width > _originImageRef.current.width()) {
            width = _originImageRef.current.width() - x;
        }
        if (y < 0) {
            height += y;
            y = 0;
        }
        if (y + height > _originImageRef.current.height()) {
            height = _originImageRef.current.height() - y;
        }
        _clipRectRef.current.setAttrs({
            x,
            y,
            width,
            height,
            scaleX: 1,
            scaleY: 1,
        });
        _cropTransformerRef.current.absolutePosition(_clipRectRef.current.absolutePosition());
        _clipGroupRef.current.clip({
            x,
            y,
            width,
            height,
        });
    }


    const _handleCropEnd = (e: KonvaEventObject<MouseEvent>) => {
        if (!transformer.transformerRef.current) return;
        if (!e.target.hasName("mask")) {
            return;
        }
        if (!_clipImageRef.current || !_originImageRef.current || !_clipRectRef.current || !_cropGroupRef.current
            || !_clipGroupRef.current || !_cropTransformerRef.current || !_scaleTransformerRef.current
        ) return;
        const selectedImage = transformer.transformerRef.current?.nodes()[0] as Konva.Image;

        const image = selectedImage.image() as HTMLImageElement

        const ratio = _originImageRef.current.width() / image.width;
        const cropX = _clipRectRef.current.x() / ratio;
        const cropY = _clipRectRef.current.y() / ratio;
        const width = _clipRectRef.current.width();
        const height = _clipRectRef.current.height();
        const cropWidth = (width * image.width) / _originImageRef.current.width();
        const cropHeight = (height * image.height) / _originImageRef.current.height();
        selectedImage.setAttrs({
            width,
            height,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
        });
        selectedImage.absolutePosition(_clipRectRef.current.absolutePosition());
        selectedImage.show();
        transformer.transformerRef.current.show();
        cropDone();
    }

    useEffect(() => {
        if (!transformer.transformerRef.current) return;
        if (groupRef.current) {
            const selectedImage = transformer.transformerRef.current?.nodes()[0] as Konva.Image;
            const abspos = selectedImage.absolutePosition();
            const ratio = selectedImage.width() / selectedImage.cropWidth();

            const originWidth = ratio * (selectedImage.image() as HTMLImageElement).width;
            const originHeight = ratio * (selectedImage.image() as HTMLImageElement).height;
            const cropX = selectedImage.cropX() * ratio;
            const cropY = selectedImage.cropY() * ratio;


            if (!_clipImageRef.current || !_originImageRef.current || !_clipRectRef.current || !_cropGroupRef.current
                || !_clipGroupRef.current || !_cropTransformerRef.current || !_scaleTransformerRef.current
            ) return;


            _originImageRef.current.setAttrs({
                ...selectedImage.getAttrs(),
                cropX: 0,
                cropY: 0,
                cropWidth: 0,
                cropHeight: 0,
                width: originWidth,
                height: originHeight,
                draggable: false,
            })

            _cropGroupRef.current.setAttrs({
                rotation: selectedImage.rotation(),
                draggable: false,
                absolutePosition: {
                    x: abspos.x,
                    y: abspos.y,
                },
            })
            _clipRectRef.current.setAttrs({
                width: selectedImage.width(),
                height: selectedImage.height(),
                draggable: true,
            })

            _clipImageRef.current.setAttrs({
                ..._originImageRef.current.getAttrs(),
                x: 0,
                y: 0,
                rotation: 0,
            })


            // 放在这里，不然_originImageRef属性中获取的visible:false
            transformer.transformerRef.current.hide();
            selectedImage.hide();

            // position()相对于父容器,这里是group，absolutePosition()就是相对于画布
            _clipRectRef.current.position({ x: -cropX, y: -cropY });
            const pos = _clipRectRef.current.absolutePosition();

            _originImageRef.current.absolutePosition({ ...pos });
            _cropGroupRef.current.absolutePosition({ ...pos });
            _clipRectRef.current.position({ x: cropX, y: cropY });

            _handleCrop();
            _cropTransformerRef.current.nodes([_clipRectRef.current]);
            _scaleTransformerRef.current.nodes([_originImageRef.current]);
            _cropTransformerRef.current.zIndex(4);
            _scaleTransformerRef.current.zIndex(3);

            stage.current?.on("pointerdown", _handleCropEnd);

            return () => {
                stage.current?.off("pointerdown", _handleCropEnd);
            }
        }
    }, []);

    return (
        <Group ref={groupRef}>
            <KonvaImage
                image={(transformer.transformerRef.current?.nodes()[0] as Konva.Image).image()}
                ref={_originImageRef}
                onTransform={_handleScale}
            />
            <Rect
                name="mask"
                ref={_maskRectRef}
                x={0}
                y={0}
                width={stage.current?.width() ?? 100}
                height={stage.current?.height() ?? 100}
                fill="rgba(0, 0, 0, 0.5)"
                zIndex={2}
            />
            <Group ref={_cropGroupRef}>
                <Group ref={_clipGroupRef}>
                    <KonvaImage
                        image={(transformer.transformerRef.current?.nodes()[0] as Konva.Image).image()}
                        ref={_clipImageRef}
                    />
                </Group>
                <Rect
                    ref={_clipRectRef}
                    draggable
                />
            </Group>

            <Transformer
                ref={_scaleTransformerRef}
                enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                anchorCornerRadius={50}
                anchorSize={20}
                keepRatio={true}
                rotateEnabled={false} 
            />
            <Transformer
                ref={_cropTransformerRef}
                enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                onDragMove={_handleDrag}
                onTransform={_handleCrop}
                keepRatio={false}
                rotateEnabled={false}
            />
        </Group>
    );
};

export default CropScene;

