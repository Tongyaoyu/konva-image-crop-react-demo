import Konva from "konva";
import { RefObject, useRef } from "react";

const useTransformer = () => {
    const transformerRef = useRef() as RefObject<Konva.Transformer>;


    return {
        transformerRef,
    };
}

export default useTransformer;
