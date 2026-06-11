import { create } from 'zustand';
import type { CanvasElement, Theme, ColorPalette, ThemeId } from '@/types';
import { themes } from '@/data/themes';
import { generateColorPalette } from '@/lib/colorUtils';

interface CanvasState {
  elements: CanvasElement[];
  selectedElementId: string | null;
  selectedElementIds: string[];
  currentTheme: Theme;
  currentThemeId: ThemeId;
  colorPalette: ColorPalette;
  canvasBackground: string;
  canvasWidth: number;
  canvasHeight: number;
  nextZIndex: number;

  addElement: (element: Omit<CanvasElement, 'id' | 'zIndex'>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateElements: (ids: string[], updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  deleteElements: (ids: string[]) => void;
  selectElement: (id: string | null) => void;
  toggleElementSelection: (id: string) => void;
  selectMultipleElements: (ids: string[]) => void;
  clearSelection: () => void;
  moveElement: (id: string, x: number, y: number) => void;
  moveElements: (ids: string[], dx: number, dy: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
  bringToFront: (id: string) => void;
  bringToFrontMultiple: (ids: string[]) => void;
  sendToBack: (id: string) => void;
  sendToBackMultiple: (ids: string[]) => void;
  duplicateElement: (id: string) => void;
  clearCanvas: () => void;

  setTheme: (themeId: ThemeId) => void;
  setPrimaryColor: (color: string) => void;
  setCanvasBackground: (color: string) => void;
  setCanvasSize: (width: number, height: number) => void;
}

let elementIdCounter = 0;
const generateId = () => `elem_${Date.now()}_${elementIdCounter++}`;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  selectedElementId: null,
  selectedElementIds: [],
  currentTheme: themes.retro,
  currentThemeId: 'retro',
  colorPalette: generateColorPalette(themes.retro.primaryColor),
  canvasBackground: themes.retro.backgroundColor,
  canvasWidth: 800,
  canvasHeight: 1000,
  nextZIndex: 1,

  addElement: (elementData) => {
    const state = get();
    const newElement: CanvasElement = {
      ...elementData,
      id: generateId(),
      zIndex: state.nextZIndex,
    };
    set({
      elements: [...state.elements, newElement],
      selectedElementId: newElement.id,
      selectedElementIds: [newElement.id],
      nextZIndex: state.nextZIndex + 1,
    });
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  },

  updateElements: (ids, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        ids.includes(el.id) ? { ...el, ...updates } : el
      ),
    }));
  },

  deleteElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
      selectedElementIds: state.selectedElementIds.filter((sid) => sid !== id),
    }));
  },

  deleteElements: (ids) => {
    set((state) => ({
      elements: state.elements.filter((el) => !ids.includes(el.id)),
      selectedElementId:
        state.selectedElementId && ids.includes(state.selectedElementId)
          ? null
          : state.selectedElementId,
      selectedElementIds: state.selectedElementIds.filter((sid) => !ids.includes(sid)),
    }));
  },

  selectElement: (id) => {
    set({
      selectedElementId: id,
      selectedElementIds: id ? [id] : [],
    });
  },

  toggleElementSelection: (id) => {
    set((state) => {
      const isSelected = state.selectedElementIds.includes(id);
      const newIds = isSelected
        ? state.selectedElementIds.filter((sid) => sid !== id)
        : [...state.selectedElementIds, id];
      return {
        selectedElementIds: newIds,
        selectedElementId: newIds.length === 1 ? newIds[0] : newIds.length > 1 ? id : null,
      };
    });
  },

  selectMultipleElements: (ids) => {
    set({
      selectedElementIds: ids,
      selectedElementId: ids.length === 1 ? ids[0] : null,
    });
  },

  clearSelection: () => {
    set({
      selectedElementId: null,
      selectedElementIds: [],
    });
  },

  moveElement: (id, x, y) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, x, y } : el
      ),
    }));
  },

  moveElements: (ids, dx, dy) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        ids.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el
      ),
    }));
  },

  resizeElement: (id, width, height) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, width, height } : el
      ),
    }));
  },

  bringToFront: (id) => {
    const state = get();
    let currentZ = state.nextZIndex;
    set({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, zIndex: currentZ++ } : el
      ),
      nextZIndex: currentZ,
    });
  },

  bringToFrontMultiple: (ids) => {
    const state = get();
    const sorted = [...state.elements]
      .filter((el) => ids.includes(el.id))
      .sort((a, b) => a.zIndex - b.zIndex);
    let currentZ = state.nextZIndex;
    const zIndexMap = new Map<string, number>();
    sorted.forEach((el) => zIndexMap.set(el.id, currentZ++));
    set({
      elements: state.elements.map((el) =>
        zIndexMap.has(el.id) ? { ...el, zIndex: zIndexMap.get(el.id)! } : el
      ),
      nextZIndex: currentZ,
    });
  },

  sendToBack: (id) => {
    set((state) => {
      const minZ = Math.min(...state.elements.map((el) => el.zIndex));
      let currentZ = minZ - 1;
      return {
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, zIndex: currentZ-- } : el
        ),
      };
    });
  },

  sendToBackMultiple: (ids) => {
    set((state) => {
      const sorted = [...state.elements]
        .filter((el) => ids.includes(el.id))
        .sort((a, b) => a.zIndex - b.zIndex);
      const minZ = Math.min(...state.elements.map((el) => el.zIndex));
      let currentZ = minZ - sorted.length;
      const zIndexMap = new Map<string, number>();
      sorted.forEach((el) => zIndexMap.set(el.id, currentZ++));
      return {
        elements: state.elements.map((el) =>
          zIndexMap.has(el.id) ? { ...el, zIndex: zIndexMap.get(el.id)! } : el
        ),
      };
    });
  },

  duplicateElement: (id) => {
    const state = get();
    const element = state.elements.find((el) => el.id === id);
    if (element) {
      const newElement: CanvasElement = {
        ...element,
        id: generateId(),
        x: element.x + 20,
        y: element.y + 20,
        zIndex: state.nextZIndex,
      };
      set({
        elements: [...state.elements, newElement],
        selectedElementId: newElement.id,
        selectedElementIds: [newElement.id],
        nextZIndex: state.nextZIndex + 1,
      });
    }
  },

  clearCanvas: () => {
    set({
      elements: [],
      selectedElementId: null,
      selectedElementIds: [],
      nextZIndex: 1,
    });
  },

  setTheme: (themeId) => {
    const theme = themes[themeId];
    set({
      currentTheme: theme,
      currentThemeId: themeId,
      colorPalette: generateColorPalette(theme.primaryColor),
      canvasBackground: theme.backgroundColor,
    });
  },

  setPrimaryColor: (color) => {
    set({
      colorPalette: generateColorPalette(color),
    });
  },

  setCanvasBackground: (color) => {
    set({ canvasBackground: color });
  },

  setCanvasSize: (width, height) => {
    set({ canvasWidth: width, canvasHeight: height });
  },
}));
