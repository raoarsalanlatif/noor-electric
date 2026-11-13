/* eslint-disable react/prop-types, react/no-unknown-property */
import { useMemo } from 'react';
import { solarCellsTexture } from './textures';

export const PANEL_TILT = (15 * Math.PI) / 180;

/** Aluminium-framed mono panel; face points up, long side along z. */
export default function SolarPanelModel({ panel, cellsRef, dirt = 0 }) {
  const cells = useMemo(() => solarCellsTexture(), []);
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[panel.width, 0.045, panel.length]} />
        <meshStandardMaterial color="#cfd5dd" metalness={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[panel.width - 0.05, panel.length - 0.05]} />
        <meshStandardMaterial
          ref={cellsRef}
          map={cells}
          metalness={0.25}
          roughness={0.22}
          emissive="#2f6bff"
          emissiveIntensity={0.02}
          color={dirt > 0 ? '#b59b74' : '#ffffff'}
        />
      </mesh>
    </group>
  );
}

/** Mounting legs for a tilted panel sitting on a flat roof. */
export function PanelLegs({ panel, base = 0.25 }) {
  const depth = panel.length * Math.cos(PANEL_TILT);
  const back = base + Math.sin(PANEL_TILT) * panel.length;
  const legs = [];
  [-panel.width / 2 + 0.1, panel.width / 2 - 0.1].forEach((x) => {
    legs.push([x, base / 2, depth / 2 - 0.1, base]);
    legs.push([x, back / 2, -depth / 2 + 0.1, back]);
  });
  return legs.map(([x, y, z, h], i) => (
    <mesh key={i} position={[x, y, z]} castShadow>
      <boxGeometry args={[0.04, h, 0.04]} />
      <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.35} />
    </mesh>
  ));
}
