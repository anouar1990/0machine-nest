'use client';

import React, { useRef, useState } from 'react';
import { useNestStore } from '../../state/useNestStore';
import { checkSheetCollision, checkPartCollision, getAbsolutePartContours } from '../../nesting/collision';
import { Lock, Plus, AlertTriangle, Layers3 } from 'lucide-react';
import { MinimalistToolPalette } from '../MinimalistToolPalette/MinimalistToolPalette';

export const SheetCanvas: React.FC = () => {
  const {
    sheet,
    sheets,
    activeSheetIndex,
    setActiveSheetIndex,
    addSheet,
    removeSheet,
    parts,
    selectedPartIds,
    zoom,
    pan,
    gridVisible,
    rulersVisible,
    setZoom,
    setPan,
    movePart,
    rotatePart,
    selectPart,
    clearSelection,
  } = useNestStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingPartId, setDraggingPartId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const SCALE_PIXELS_PER_MM = 1.8;
  const sheetPixelWidth = sheet.width * SCALE_PIXELS_PER_MM;
  const sheetPixelHeight = sheet.height * SCALE_PIXELS_PER_MM;

  // Filter parts belonging to the currently active sheet
  const activeSheetParts = parts.filter(
    (p) => p.sheetIndex === undefined || p.sheetIndex === activeSheetIndex
  );

  // Real-time overlap & clearance warning check
  let hasOverlap = false;
  let hasOutOfBounds = false;

  for (let i = 0; i < activeSheetParts.length; i++) {
    const pA = activeSheetParts[i];
    if (checkSheetCollision(pA, sheet)) {
      hasOutOfBounds = true;
    }
    for (let j = i + 1; j < activeSheetParts.length; j++) {
      if (checkPartCollision(pA, activeSheetParts[j], sheet.spacing || 3)) {
        hasOverlap = true;
      }
    }
  }

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.max(0.3, Math.min(4.0, prev * zoomFactor)));
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey || (e.shiftKey && selectedPartIds.length === 0)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (draggingPartId) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      const mouseX = (e.clientX - rect.left - pan.x) / (SCALE_PIXELS_PER_MM * zoom);
      const mouseY = (e.clientY - rect.top - pan.y) / (SCALE_PIXELS_PER_MM * zoom);

      let targetX = mouseX - dragOffset.x;
      let targetY = mouseY - dragOffset.y;

      // Smart Snapping (Margin lines within 3mm threshold)
      const margin = sheet.margin || 5;
      const snapThreshold = 3;

      if (Math.abs(targetX - margin) < snapThreshold) targetX = margin;
      if (Math.abs(targetY - margin) < snapThreshold) targetY = margin;

      targetX = Math.max(0, Math.min(sheet.width - 5, targetX));
      targetY = Math.max(0, Math.min(sheet.height - 5, targetY));

      movePart(draggingPartId, targetX, targetY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingPartId(null);
  };

  const handlePartMouseDown = (e: React.MouseEvent, partId: string, posX: number, posY: number) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    selectPart(partId, e.shiftKey || e.metaKey || e.ctrlKey);

    const part = parts.find((p) => p.id === partId);
    if (part && !part.locked) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / (SCALE_PIXELS_PER_MM * zoom);
      const mouseY = (e.clientY - rect.top - pan.y) / (SCALE_PIXELS_PER_MM * zoom);

      setDraggingPartId(partId);
      setDragOffset({ x: mouseX - posX, y: mouseY - posY });
    }
  };

  const pointsToSvgPath = (pts: { x: number; y: number }[]) => {
    if (!pts || pts.length < 2) return '';
    let d = `M ${pts[0].x * SCALE_PIXELS_PER_MM} ${pts[0].y * SCALE_PIXELS_PER_MM}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x * SCALE_PIXELS_PER_MM} ${pts[i].y * SCALE_PIXELS_PER_MM}`;
    }
    return d + ' Z';
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full bg-[#0a0d14] overflow-hidden select-none cursor-crosshair flex flex-col"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => clearSelection()}
    >
      {/* Multi-Sheet Header Bar */}
      <div className="h-10 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between z-20 backdrop-blur-md">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 mr-2 shrink-0">
            <Layers3 className="w-3.5 h-3.5 text-cyan-400" />
            SHEETS ({sheets.length}):
          </div>

          {sheets.map((s, idx) => (
            <div
              key={s.id || idx}
              onClick={() => setActiveSheetIndex(idx)}
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono font-bold cursor-pointer transition-all ${
                activeSheetIndex === idx
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>Sheet #{idx + 1}</span>
              {sheets.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSheet(idx);
                  }}
                  className="hover:text-red-400 text-slate-500 px-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addSheet}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono rounded-md border border-slate-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Sheet
          </button>
        </div>

        {/* Warning Badges */}
        <div className="flex items-center gap-2">
          {hasOverlap && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-[11px] font-bold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              ⚠ {sheet.spacing}mm CLEARANCE REQUIRED / OVERLAP DETECTED
            </div>
          )}
          {hasOutOfBounds && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-[11px] font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              ⚠ OUT OF MATERIAL BOUNDS
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Background Technical Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {/* Rulers Overlay (MM) */}
        {rulersVisible && (
          <>
            <div className="absolute top-0 left-0 right-0 h-6 bg-[#0f172a] border-b border-cyan-900/40 text-[9px] font-mono text-cyan-400 flex items-center px-8 z-10 pointer-events-none overflow-hidden">
              <span className="mr-8 text-cyan-500 font-semibold">MM</span>
              {Array.from({ length: Math.ceil(sheet.width / 50) }).map((_, i) => (
                <span key={i} className="inline-block" style={{ width: 50 * SCALE_PIXELS_PER_MM * zoom }}>
                  {i * 50}
                </span>
              ))}
            </div>
            <div className="absolute top-6 left-0 bottom-0 w-6 bg-[#0f172a] border-r border-cyan-900/40 text-[9px] font-mono text-cyan-400 flex flex-col items-center py-4 z-10 pointer-events-none overflow-hidden">
              {Array.from({ length: Math.ceil(sheet.height / 50) }).map((_, i) => (
                <span key={i} className="block mb-8" style={{ height: 50 * SCALE_PIXELS_PER_MM * zoom }}>
                  {i * 50}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Interactive Workspace Sheet Frame */}
        <div
          className="absolute transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x + 40}px, ${pan.y + 40}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <div
            className="relative bg-[#111827] shadow-2xl border-2 border-slate-700/80 rounded-sm"
            style={{ width: sheetPixelWidth, height: sheetPixelHeight }}
          >
            {/* Margin Boundary Indicator */}
            <div
              className="absolute border border-dashed border-cyan-500/40 pointer-events-none"
              style={{
                top: sheet.margin * SCALE_PIXELS_PER_MM,
                left: sheet.margin * SCALE_PIXELS_PER_MM,
                width: (sheet.width - 2 * sheet.margin) * SCALE_PIXELS_PER_MM,
                height: (sheet.height - 2 * sheet.margin) * SCALE_PIXELS_PER_MM,
              }}
            >
              <span className="absolute top-1 left-1 text-[9px] font-mono text-cyan-400/60 uppercase">
                Margin: {sheet.margin}mm
              </span>
            </div>

            {/* Grid Pattern */}
            {gridVisible && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="grid-pattern"
                    width={10 * SCALE_PIXELS_PER_MM}
                    height={10 * SCALE_PIXELS_PER_MM}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${10 * SCALE_PIXELS_PER_MM} 0 L 0 0 0 ${10 * SCALE_PIXELS_PER_MM}`}
                      fill="none"
                      stroke="#00f0ff"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              </svg>
            )}

            {/* Render Active Sheet SVG Parts */}
            <svg className="absolute inset-0 w-full h-full overflow-visible">
              {activeSheetParts.map((part) => {
                const isSelected = selectedPartIds.includes(part.id);
                const isOob = checkSheetCollision(part, sheet);
                const { contours, holes } = getAbsolutePartContours(part);
                const color = part.color || '#00f0ff';

                return (
                  <g
                    key={part.id}
                    className="cursor-pointer transition-opacity duration-150"
                    onMouseDown={(e) =>
                      handlePartMouseDown(e, part.id, part.position.x, part.position.y)
                    }
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      rotatePart(part.id);
                    }}
                  >
                    {/* Outer Contours */}
                    {contours.map((contour, idx) => (
                      <path
                        key={`contour-${idx}`}
                        d={pointsToSvgPath(contour)}
                        fill={isOob ? 'rgba(239, 68, 68, 0.25)' : isSelected ? `${color}33` : `${color}15`}
                        stroke={isOob ? '#ef4444' : isSelected ? '#ffffff' : color}
                        strokeWidth={isSelected ? '2' : '1.2'}
                        strokeDasharray={isOob ? '4,4' : 'none'}
                        className={isSelected ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : ''}
                      />
                    ))}

                    {/* Inner Holes */}
                    {holes.map((hole, idx) => (
                      <path
                        key={`hole-${idx}`}
                        d={pointsToSvgPath(hole)}
                        fill="#111827"
                        stroke="#fbbf24"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Selection Outline & Badges */}
                    {isSelected && (
                      <g className="pointer-events-none">
                        <rect
                          x={part.position.x * SCALE_PIXELS_PER_MM}
                          y={part.position.y * SCALE_PIXELS_PER_MM}
                          width={part.width * SCALE_PIXELS_PER_MM}
                          height={part.height * SCALE_PIXELS_PER_MM}
                          fill="none"
                          stroke="#00f0ff"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <text
                          x={part.position.x * SCALE_PIXELS_PER_MM}
                          y={(part.position.y - 4) * SCALE_PIXELS_PER_MM}
                          fill="#00f0ff"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {part.width.toFixed(1)} × {part.height.toFixed(1)} mm ({part.rotation}°)
                        </text>
                      </g>
                    )}

                    {/* Lock Badge */}
                    {part.locked && (
                      <foreignObject
                        x={part.position.x * SCALE_PIXELS_PER_MM + 4}
                        y={part.position.y * SCALE_PIXELS_PER_MM + 4}
                        width="20"
                        height="20"
                      >
                        <div className="bg-amber-500/90 text-black p-0.5 rounded shadow">
                          <Lock className="w-3 h-3" />
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Minimalist Quick Action Dock */}
        <MinimalistToolPalette />
      </div>
    </div>
  );
};
