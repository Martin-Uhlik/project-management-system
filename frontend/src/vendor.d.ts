// Types for the packages that ship none

// OpenCascade compiled to WebAssembly (components/projects/task/files/previews/ModelPreview.tsx): only what the app uses
declare module 'occt-import-js' {
    export interface OcctMesh {
        attributes: { position: { array: number[] }; normal?: { array: number[] } };
        index: { array: number[] };
        color?: [number, number, number];
    }
    export interface OcctResult {
        success: boolean;
        meshes: OcctMesh[];
    }
    export interface Occt {
        ReadStepFile(content: Uint8Array, params: unknown): OcctResult;
        ReadIgesFile(content: Uint8Array, params: unknown): OcctResult;
        ReadBrepFile(content: Uint8Array, params: unknown): OcctResult;
    }
    const occtimportjs: (options?: { locateFile?: (path: string) => string }) => Promise<Occt>;
    export default occtimportjs;
}
