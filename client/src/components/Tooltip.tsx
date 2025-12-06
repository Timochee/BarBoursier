import { useState, useRef, useCallback } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'bottom' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();

    // Create a temporary element to measure tooltip size
    const temp = document.createElement('div');
    temp.style.cssText = 'position:fixed;visibility:hidden;padding:8px 12px;font-size:14px;max-width:320px;white-space:normal;';
    temp.textContent = content;
    document.body.appendChild(temp);
    const tooltipWidth = temp.offsetWidth;
    const tooltipHeight = temp.offsetHeight;
    document.body.removeChild(temp);

    // Center horizontally
    let left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + tooltipWidth > window.innerWidth - 8) {
      left = window.innerWidth - tooltipWidth - 8;
    }

    const top = position === 'bottom'
      ? triggerRect.bottom + 8
      : triggerRect.top - tooltipHeight - 8;

    setCoords({ top, left });
    setIsVisible(true);
  }, [content, position]);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className="z-50 px-3 py-2 text-sm rounded-lg shadow-lg max-w-xs whitespace-normal animate-fade-in"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}
