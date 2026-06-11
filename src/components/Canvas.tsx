import { forwardRef, useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import CanvasElementRenderer from './CanvasElementRenderer';

interface CanvasProps {
  className?: string;
}

interface MarqueeState {
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ className = '' }, ref) => {
  const {
    elements,
    selectedElementIds,
    canvasBackground,
    canvasWidth,
    canvasHeight,
    currentTheme,
    selectElement,
    toggleElementSelection,
    selectMultipleElements,
    clearSelection,
    moveElement,
    moveElements,
    resizeElement,
    updateElement,
    deleteElement,
    deleteElements,
    bringToFront,
    duplicateElement,
  } = useCanvasStore();

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<MarqueeState>({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT') {
          return;
        }
        e.preventDefault();
        if (selectedElementIds.length === 1) {
          deleteElement(selectedElementIds[0]);
        } else {
          deleteElements(selectedElementIds);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedElementIds.length === 1) {
        e.preventDefault();
        duplicateElement(selectedElementIds[0]);
      }
      if (e.key === 'Escape') {
        clearSelection();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        selectMultipleElements(elements.map((el) => el.id));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, deleteElement, deleteElements, duplicateElement, clearSelection, selectMultipleElements, elements]);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvasEl = canvasContainerRef.current;
    if (!canvasEl) return { x: 0, y: 0 };
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const isMultiSelectKey = e.shiftKey || e.metaKey || e.ctrlKey;

    if (!isMultiSelectKey) {
      clearSelection();
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    setMarquee({
      active: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
  };

  useEffect(() => {
    if (!marquee.active) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      setMarquee((prev) => ({ ...prev, currentX: x, currentY: y }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const startX = Math.min(marquee.startX, marquee.currentX);
      const startY = Math.min(marquee.startY, marquee.currentY);
      const endX = Math.max(marquee.startX, marquee.currentX);
      const endY = Math.max(marquee.startY, marquee.currentY);
      const width = endX - startX;
      const height = endY - startY;

      const isMultiSelectKey = e.shiftKey || e.metaKey || e.ctrlKey;
      const isClick = width < 5 && height < 5;

      if (!isClick) {
        const selectedIds = elements
          .filter((el) => {
            const elRight = el.x + el.width;
            const elBottom = el.y + el.height;
            return el.x < endX && elRight > startX && el.y < endY && elBottom > startY;
          })
          .map((el) => el.id);

        if (isMultiSelectKey) {
          const merged = Array.from(new Set([...selectedElementIds, ...selectedIds]));
          selectMultipleElements(merged);
        } else {
          selectMultipleElements(selectedIds);
        }
      }

      setMarquee({
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [marquee.active, marquee.startX, marquee.startY, marquee.currentX, marquee.currentY, elements, selectedElementIds, selectMultipleElements]);

  const handleElementSelect = (elementId: string, e: React.MouseEvent) => {
    const isMultiSelectKey = e.shiftKey || e.metaKey || e.ctrlKey;
    if (isMultiSelectKey) {
      toggleElementSelection(elementId);
    } else {
      if (selectedElementIds.includes(elementId) && selectedElementIds.length === 1) {
        selectElement(elementId);
      } else if (selectedElementIds.includes(elementId) && selectedElementIds.length > 1) {
        return;
      } else {
        selectElement(elementId);
      }
      bringToFront(elementId);
    }
  };

  const handleMultiDrag = (dx: number, dy: number) => {
    if (selectedElementIds.length > 1) {
      moveElements(selectedElementIds, dx, dy);
    }
  };

  const getPatternStyle = () => {
    switch (currentTheme.pattern) {
      case 'dots':
        return {
          backgroundImage: `radial-gradient(circle, rgba(139, 105, 20, 0.08) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        };
      case 'grid':
        return {
          backgroundImage: `
            linear-gradient(rgba(3, 105, 161, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(3, 105, 161, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '25px 25px',
        };
      case 'lines':
        return {
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(4, 120, 87, 0.08) 24px, rgba(4, 120, 87, 0.08) 25px)`,
        };
      case 'hearts':
        return {
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(219, 39, 119, 0.05) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(219, 39, 119, 0.05) 0, transparent 40%)`,
          backgroundSize: '60px 60px',
        };
      default:
        return {};
    }
  };

  const getMarqueeStyle = (): React.CSSProperties => {
    const left = Math.min(marquee.startX, marquee.currentX);
    const top = Math.min(marquee.startY, marquee.currentY);
    const width = Math.abs(marquee.currentX - marquee.startX);
    const height = Math.abs(marquee.currentY - marquee.startY);
    return {
      position: 'absolute',
      left,
      top,
      width,
      height,
      border: '1px solid #3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      pointerEvents: 'none',
      zIndex: 9999,
    };
  };

  return (
    <div className={`flex flex-1 items-center justify-center overflow-auto bg-gray-100 p-8 ${className}`}>
      <div
        ref={ref}
        id="journal-canvas"
        className="relative shadow-2xl transition-shadow"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: canvasBackground,
          minWidth: canvasWidth,
          minHeight: canvasHeight,
          ...getPatternStyle(),
        }}
      >
        <div
          ref={canvasContainerRef}
          className="absolute inset-0"
          style={{ width: canvasWidth, height: canvasHeight }}
          onMouseDown={handleCanvasMouseDown}
        >
          {elements.map((element) => (
            <CanvasElementRenderer
              key={element.id}
              element={element}
              isSelected={selectedElementIds.includes(element.id)}
              selectedCount={selectedElementIds.length}
              onSelect={(e) => handleElementSelect(element.id, e)}
              onMove={(x, y) => moveElement(element.id, x, y)}
              onMultiDrag={handleMultiDrag}
              onResize={(w, h) => resizeElement(element.id, w, h)}
              onUpdate={(updates) => updateElement(element.id, updates)}
            />
          ))}

          {marquee.active && <div style={getMarqueeStyle()} />}

          {elements.length === 0 && (
            <div className="pointer-events-none flex h-full w-full flex-col items-center justify-center text-center">
              <div className="text-6xl opacity-30">📓</div>
              <p className="mt-4 text-lg font-medium text-gray-500">开始创作你的手账吧</p>
              <p className="mt-2 text-sm text-gray-400">从左侧素材库添加元素</p>
              <p className="mt-1 text-xs text-gray-400">按住 Shift 或 Ctrl/Cmd 可多选，拖拽可框选</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
