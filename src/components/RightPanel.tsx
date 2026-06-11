import { useState } from 'react';
import { Palette, Layers, Settings2, Download, Trash2, Copy, ArrowUpToLine, ArrowDownToLine, RotateCw } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { themeList } from '@/data/themes';
import type { ThemeId } from '@/types';

type Tab = 'properties' | 'themes' | 'palette';

export default function RightPanel({ onExport }: { onExport: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('properties');
  const {
    selectedElementId,
    selectedElementIds,
    elements,
    currentThemeId,
    colorPalette,
    currentTheme,
    setTheme,
    setPrimaryColor,
    updateElement,
    updateElements,
    deleteElement,
    deleteElements,
    duplicateElement,
    bringToFront,
    bringToFrontMultiple,
    sendToBack,
    sendToBackMultiple,
    clearCanvas,
  } = useCanvasStore();

  const selectedElement = elements.find((e) => e.id === selectedElementId);
  const hasSingleSelection = selectedElementIds.length === 1;
  const hasMultiSelection = selectedElementIds.length > 1;

  const tabs = [
    { id: 'properties' as Tab, name: '属性', icon: Settings2 },
    { id: 'themes' as Tab, name: '主题', icon: Layers },
    { id: 'palette' as Tab, name: '色板', icon: Palette },
  ];

  const getMultiOpacity = () => {
    const selected = elements.filter((e) => selectedElementIds.includes(e.id));
    if (selected.length === 0) return 100;
    const opacities = selected.map((e) => e.opacity ?? 1);
    const allSame = opacities.every((o) => o === opacities[0]);
    return allSame ? Math.round(opacities[0] * 100) : 50;
  };

  const renderMultiSelection = () => {
    const opacityValue = getMultiOpacity();

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/25">
            <span className="text-xl font-bold">{selectedElementIds.length}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-800">已选中 {selectedElementIds.length} 个元素</h3>
            <p className="text-xs text-gray-500">可批量调整不透明度、层级或删除</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => bringToFrontMultiple(selectedElementIds)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
            title="全部置顶"
          >
            <ArrowUpToLine className="h-3.5 w-3.5" />
            置顶
          </button>
          <button
            onClick={() => sendToBackMultiple(selectedElementIds)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
            title="全部置底"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            置底
          </button>
          <button
            onClick={() => {
              if (confirm(`确定要删除选中的 ${selectedElementIds.length} 个元素吗？`)) {
                deleteElements(selectedElementIds);
              }
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
            title="批量删除"
          >
            <Trash2 className="h-3.5 w-3.5" />
            删除
          </button>
        </div>

        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">
            <span>不透明度</span>
            <span className="text-[10px] text-gray-400">{opacityValue}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={opacityValue}
            onChange={(e) => updateElements(selectedElementIds, { opacity: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <h4 className="mb-1 flex items-center gap-1 text-xs font-semibold text-amber-800">
            💡 多选操作提示
          </h4>
          <ul className="space-y-1 text-[11px] leading-relaxed text-amber-900/80">
            <li>• 按住 Shift 或 Ctrl/Cmd 点击可多选</li>
            <li>• 在画布空白处拖拽可框选多个元素</li>
            <li>• 拖拽任意选中元素可整体移动</li>
            <li>• 按 Delete 键可删除全部选中元素</li>
            <li>• 按 Ctrl/Cmd+A 可全选画布元素</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderProperties = () => {
    if (hasMultiSelection) {
      return renderMultiSelection();
    }

    if (!selectedElement) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Settings2 className="h-8 w-8 text-gray-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-600">选中元素后编辑属性</p>
          <p className="mt-1 text-xs text-gray-400">点击画布中的任意元素</p>
          <p className="mt-1 text-xs text-gray-400">按住 Shift 或 Ctrl/Cmd 可多选</p>

          <div className="mt-8 w-full border-t border-gray-100 pt-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">画布操作</h3>
            <button
              onClick={() => {
                if (confirm('确定要清空画布吗？此操作不可撤销。')) clearCanvas();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              清空画布
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex gap-2">
          <button
            onClick={() => duplicateElement(selectedElement.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
            title="复制 (Ctrl+D)"
          >
            <Copy className="h-3.5 w-3.5" />
            复制
          </button>
          <button
            onClick={() => bringToFront(selectedElement.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
            title="置顶"
          >
            <ArrowUpToLine className="h-3.5 w-3.5" />
            置顶
          </button>
          <button
            onClick={() => sendToBack(selectedElement.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
            title="置底"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            置底
          </button>
          <button
            onClick={() => deleteElement(selectedElement.id)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
            title="删除 (Delete)"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">位置 X / Y</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={Math.round(selectedElement.x)}
              onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="number"
              value={Math.round(selectedElement.y)}
              onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">尺寸 宽 / 高</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={Math.round(selectedElement.width)}
              onChange={(e) => updateElement(selectedElement.id, { width: Math.max(30, Number(e.target.value)) })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="number"
              value={Math.round(selectedElement.height)}
              onChange={(e) => updateElement(selectedElement.id, { height: Math.max(30, Number(e.target.value)) })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">
            <span>旋转角度</span>
            <button
              onClick={() => updateElement(selectedElement.id, { rotation: 0 })}
              className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600"
            >
              <RotateCw className="h-3 w-3" /> 重置
            </button>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-180"
              max="180"
              value={selectedElement.rotation}
              onChange={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="w-12 text-right text-xs tabular-nums text-gray-500">{selectedElement.rotation}°</span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">
            <span>不透明度</span>
            <span className="text-[10px] text-gray-400">{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={(selectedElement.opacity ?? 1) * 100}
            onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </div>

        {(selectedElement.type === 'date' || selectedElement.type === 'sticky' || selectedElement.type === 'photo') && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">圆角</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={selectedElement.borderRadius ?? 0}
                onChange={(e) => updateElement(selectedElement.id, { borderRadius: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="w-12 text-right text-xs tabular-nums text-gray-500">{selectedElement.borderRadius ?? 0}px</span>
            </div>
          </div>
        )}

        {(selectedElement.type === 'date' || selectedElement.type === 'sticky' || selectedElement.type === 'photo') && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">背景颜色</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedElement.backgroundColor || '#FFFFFF'}
                onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200"
              />
              <div className="flex flex-1 flex-wrap gap-1">
                {Object.values(colorPalette).slice(0, 8).map((color) => (
                  <button
                    key={color}
                    onClick={() => updateElement(selectedElement.id, { backgroundColor: color })}
                    className="h-7 w-7 rounded-md border border-gray-200 transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {(selectedElement.type === 'date' || selectedElement.type === 'sticky') && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">文字颜色</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedElement.textColor || '#000000'}
                onChange={(e) => updateElement(selectedElement.id, { textColor: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200"
              />
              <div className="flex flex-1 flex-wrap gap-1">
                {['#000000', '#FFFFFF', ...Object.values(colorPalette).slice(0, 6)].map((color) => (
                  <button
                    key={color}
                    onClick={() => updateElement(selectedElement.id, { textColor: color })}
                    className="h-7 w-7 rounded-md border border-gray-200 transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {(selectedElement.type === 'date' || selectedElement.type === 'sticky') && (
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">
              <span>文字大小</span>
              <span className="text-[10px] text-gray-400">{selectedElement.fontSize ?? 14}px</span>
            </label>
            <input
              type="range"
              min="10"
              max="48"
              value={selectedElement.fontSize ?? 14}
              onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        )}

        {selectedElement.type === 'photo' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">边框</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedElement.borderColor || '#FFFFFF'}
                  onChange={(e) => updateElement(selectedElement.id, { borderColor: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200"
                />
                <div className="flex flex-1 items-center gap-2">
                  <span className="text-xs text-gray-500">宽度</span>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={selectedElement.borderWidth ?? 0}
                    onChange={(e) => updateElement(selectedElement.id, { borderWidth: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="w-8 text-right text-xs tabular-nums text-gray-500">{selectedElement.borderWidth ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedElement.type === 'tape' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">胶带颜色</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedElement.backgroundColor || '#FCD34D'}
                onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200"
              />
              <div className="flex flex-1 flex-wrap gap-1">
                {currentTheme.decorativeColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateElement(selectedElement.id, { backgroundColor: color })}
                    className="h-7 w-7 rounded-md border border-gray-200 transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedElement.type === 'sticker' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">贴纸表情</label>
            <div className="grid grid-cols-8 gap-1 rounded-lg border border-gray-200 bg-white p-2">
              {['⭐','🌟','✨','💫','🌸','🌺','🌻','🌷','🌿','🍀','🍃','🌙','☀️','☁️','🌈','❤️','💖','💕','💌','☕','🍰','🍵','🎨','🎵','📖','📷','✈️','🗺️','🎒','🏠','🐱','🐶','🦋','🐰','🐻','🍎'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => updateElement(selectedElement.id, { emoji })}
                  className="flex h-8 w-8 items-center justify-center rounded text-lg transition-transform hover:scale-125 hover:bg-gray-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderThemes = () => (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">选择一个主题快速切换整体风格</p>
      {themeList.map((theme) => (
        <button
          key={theme.id}
          onClick={() => setTheme(theme.id as ThemeId)}
          className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
            currentThemeId === theme.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="mb-2 flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg shadow-inner"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 50%, ${theme.accentColor} 100%)`,
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-800">{theme.name}</h4>
              <p className="text-xs text-gray-500">{theme.description}</p>
            </div>
            {currentThemeId === theme.id && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                ✓
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {[theme.primaryColor, theme.secondaryColor, theme.accentColor, ...theme.decorativeColors.slice(0, 3)].map((c) => (
              <div
                key={c}
                className="h-4 flex-1 rounded-sm first:rounded-l-md last:rounded-r-md"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </button>
      ))}
    </div>
  );

  const renderPalette = () => {
    const paletteColors = [
      { key: 'primary', name: '主色', desc: '品牌核心色' },
      { key: 'secondary', name: '辅色', desc: '辅助主色' },
      { key: 'accent', name: '强调色', desc: '点缀高亮' },
      { key: 'complementary', name: '互补色', desc: '对比色' },
      { key: 'analogous1', name: '邻近色1', desc: '和谐搭配' },
      { key: 'analogous2', name: '邻近色2', desc: '和谐搭配' },
      { key: 'triadic1', name: '三角色1', desc: '三组平衡' },
      { key: 'triadic2', name: '三角色2', desc: '三组平衡' },
    ] as const;

    return (
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">基础主色</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={colorPalette.primary}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-12 w-16 cursor-pointer rounded-lg border border-gray-200"
            />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-gray-800">{colorPalette.primary}</p>
              <p className="text-xs text-gray-500">修改主色自动生成联动色板</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">🎨 智能生成色板</label>
          <div className="grid grid-cols-2 gap-2">
            {paletteColors.map(({ key, name, desc }) => (
              <div
                key={key}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
              >
                <div
                  className="h-12 w-full cursor-pointer transition-transform group-hover:scale-105"
                  style={{ backgroundColor: colorPalette[key] }}
                  onClick={() => {
                    navigator.clipboard?.writeText(colorPalette[key]);
                  }}
                  title="点击复制色值"
                />
                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-700">{name}</span>
                    <span className="font-mono text-[10px] text-gray-500">{colorPalette[key].toUpperCase()}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">🎯 主题装饰色</label>
          <div className="grid grid-cols-5 gap-1.5">
            {currentTheme.decorativeColors.map((color, idx) => (
              <button
                key={idx}
                className="group relative aspect-square rounded-lg border border-gray-200 transition-transform hover:scale-110"
                style={{ backgroundColor: color }}
                onClick={() => {
                  navigator.clipboard?.writeText(color);
                }}
                title={`${color} - 点击复制`}
              >
                <span className="absolute bottom-0.5 left-0 right-0 text-center font-mono text-[9px] text-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  {color.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">渐变配色方案</label>
          <div className="space-y-2">
            <div
              className="h-10 w-full cursor-pointer rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.complementary})`,
              }}
            />
            <div
              className="h-10 w-full cursor-pointer rounded-lg"
              style={{
                background: `linear-gradient(90deg, ${colorPalette.analogous1}, ${colorPalette.primary}, ${colorPalette.analogous2})`,
              }}
            />
            <div
              className="h-10 w-full cursor-pointer rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${colorPalette.primary} 0%, ${colorPalette.accent} 100%)`,
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <h4 className="mb-1 flex items-center gap-1 text-xs font-semibold text-amber-800">
            💡 配色建议
          </h4>
          <ul className="space-y-1 text-[11px] leading-relaxed text-amber-900/80">
            <li>• 主色占比约 60%，辅色 30%，强调色 10%</li>
            <li>• 文字用中性色，背景用浅色调</li>
            <li>• 胶带和贴纸用装饰色点缀</li>
            <li>• 点击任意色块复制色值</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-80 flex-col overflow-hidden border-l border-gray-200 bg-white">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 flex-col items-center gap-1 px-2 py-3 transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 bg-blue-50/50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[11px] font-medium">{tab.name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'properties' && renderProperties()}
        {activeTab === 'themes' && renderThemes()}
        {activeTab === 'palette' && renderPalette()}
      </div>

      <div className="border-t border-gray-200 bg-gray-50/50 p-3">
        <button
          onClick={onExport}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
        >
          <Download className="h-4 w-4" />
          导出海报图片
        </button>
        <p className="mt-2 text-center text-[10px] text-gray-400">
          快捷键: Del 删除 · Ctrl+D 复制 · Esc 取消 · Ctrl+A 全选
        </p>
      </div>
    </div>
  );
}
