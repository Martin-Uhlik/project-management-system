import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { fileExtension, useColorMode } from '../../../../ui';
import { PreviewMessage } from '../PreviewMessage';
import type { Occt } from 'occt-import-js';

const partColor = 0x9aa5b1;

// CAD files (STEP, IGES, BREP) are read by OpenCascade compiled to WebAssembly (occt-import-js, ~7 MB), fetched only
// the first time such a file is opened
let occt: Promise<Occt> | null = null;
const loadOcct = async () => {
    if (!occt) {
        occt = Promise.all([import('occt-import-js'), import('occt-import-js/dist/occt-import-js.wasm?url')]).then(([module, wasm]) =>
            (module.default ?? module)({ locateFile: () => wasm.default }),
        );
    }
    return occt;
};

const readCad = async (buffer: ArrayBuffer, extension: string) => {
    const reader = await loadOcct();
    const bytes = new Uint8Array(buffer);
    const result =
        extension === 'iges' || extension === 'igs'
            ? reader.ReadIgesFile(bytes, null)
            : extension === 'brep'
              ? reader.ReadBrepFile(bytes, null)
              : reader.ReadStepFile(bytes, null);
    if (!result.success) throw new Error('CAD file could not be read');
    const group = new THREE.Group();
    for (const mesh of result.meshes) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.attributes.position.array, 3));
        if (mesh.attributes.normal) geometry.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.attributes.normal.array, 3));
        geometry.setIndex(new THREE.Uint32BufferAttribute(Uint32Array.from(mesh.index.array), 1));
        if (!mesh.attributes.normal) geometry.computeVertexNormals();
        const color = mesh.color ? new THREE.Color(mesh.color[0], mesh.color[1], mesh.color[2]) : new THREE.Color(partColor);
        group.add(
            new THREE.Mesh(
                geometry,
                new THREE.MeshStandardMaterial({
                    color,
                    metalness: 0.1,
                    roughness: 0.6,
                    side: THREE.DoubleSide,
                }),
            ),
        );
    }
    return group;
};

// The file as a three.js object
const readModel = async (blob: Blob, name: string): Promise<THREE.Object3D> => {
    const extension = fileExtension(name);
    const buffer = await blob.arrayBuffer();
    const material = new THREE.MeshStandardMaterial({
        color: partColor,
        metalness: 0.1,
        roughness: 0.6,
        side: THREE.DoubleSide,
    });
    if (extension === 'stl') {
        const geometry = new STLLoader().parse(buffer);
        geometry.computeVertexNormals();
        return new THREE.Mesh(geometry, material);
    }
    if (extension === 'obj') {
        const object = new OBJLoader().parse(new TextDecoder().decode(buffer));
        object.traverse((child) => {
            if (child instanceof THREE.Mesh) child.material = material;
        });
        return object;
    }
    if (extension === 'glb' || extension === 'gltf') {
        const gltf = await new GLTFLoader().parseAsync(buffer, '');
        return gltf.scene;
    }
    return readCad(buffer, extension);
};

// A 3D model to turn (left mouse), move (right mouse) and zoom (wheel); the camera starts looking at the whole model
export const ModelPreview = ({ blob, name }: { blob: Blob; name: string }) => {
    const host = useRef<HTMLDivElement>(null);
    const { scheme } = useColorMode();
    const [state, setState] = useState('loading');
    const [size, setSize] = useState<THREE.Vector3 | null>(null);

    useEffect(() => {
        const container = host.current!;
        let disposed = false;
        let frame = 0;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        scene.add(new THREE.HemisphereLight(0xffffff, scheme === 'dark' ? 0x222222 : 0x888888, 2));
        const light = new THREE.DirectionalLight(0xffffff, 1.6);
        scene.add(light);

        const resize = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        resize();

        const animate = () => {
            frame = requestAnimationFrame(animate);
            controls.update();
            light.position.copy(camera.position);
            renderer.render(scene, camera);
        };

        readModel(blob, name)
            .then((object) => {
                if (disposed) return;
                // centre the model and put the camera so all of it is in view
                const box = new THREE.Box3().setFromObject(object);
                const dimensions = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                object.position.sub(center);
                scene.add(object);
                const radius = Math.max(dimensions.length() / 2, 1e-6);
                const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2));
                camera.near = distance / 100;
                camera.far = distance * 100;
                camera.position.set(distance * 0.6, distance * 0.5, distance * 0.65);
                camera.updateProjectionMatrix();
                controls.target.set(0, 0, 0);
                const grid = new THREE.GridHelper(radius * 4, 20, scheme === 'dark' ? 0x555555 : 0xbbbbbb, scheme === 'dark' ? 0x333333 : 0xdddddd);
                grid.position.y = -dimensions.y / 2;
                scene.add(grid);
                setSize(dimensions);
                setState('ready');
                animate();
            })
            .catch(() => !disposed && setState('failed'));

        return () => {
            disposed = true;
            cancelAnimationFrame(frame);
            observer.disconnect();
            controls.dispose();
            scene.traverse((child) => {
                if (!(child instanceof THREE.Mesh)) return;
                child.geometry?.dispose();
                (Array.isArray(child.material) ? child.material : [child.material]).forEach((material: THREE.Material) => material?.dispose());
            });
            renderer.dispose();
            container.removeChild(renderer.domElement);
        };
    }, [blob, name, scheme]);

    const number = (value: number) => value.toLocaleString('cs-CZ', { maximumFractionDigits: 1 });

    return (
        <Box>
            {state === 'failed' ? <PreviewMessage>Model se nepodařilo zobrazit.</PreviewMessage> : null}
            <Box
                ref={host}
                sx={{
                    display: state === 'failed' ? 'none' : 'block',
                    position: 'relative',
                    height: '60vh',
                    minHeight: '18rem',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                    '& canvas': { display: 'block' },
                }}
            >
                {state === 'loading' ? (
                    <Typography
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'grid',
                            placeItems: 'center',
                            color: 'text.secondary',
                        }}
                    >
                        Načítání modelu…
                    </Typography>
                ) : null}
            </Box>
            {state === 'ready' && size ? (
                <Typography variant='body2' sx={{ color: 'text.secondary', mt: 1 }}>
                    Rozměry {number(size.x)} × {number(size.y)} × {number(size.z)} (jednotky souboru) · otáčení levým tlačítkem, posun pravým, zoom kolečkem
                </Typography>
            ) : null}
        </Box>
    );
};
