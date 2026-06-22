import React, { useEffect, useRef } from 'react';

interface HandCursorProps {
    x: number; // normalized 0..1 (from gestures, uses same mirror convention as hand indicator)
    y: number; // normalized 0..1
    detected: boolean;
    pointerDown: boolean;
}

export const HandCursor: React.FC<HandCursorProps> = ({ x, y, detected, pointerDown }) => {
    const elRef = useRef<HTMLDivElement | null>(null);
    const lastPointerDown = useRef(false);

    // Convert normalized to client coords (match mirrored video where left uses 1-x)
    const toClient = (nx: number, ny: number) => {
        const cx = Math.max(0, Math.min(1, 1 - nx)) * window.innerWidth;
        const cy = Math.max(0, Math.min(1, ny)) * window.innerHeight;
        return [cx, cy];
    };

    // Dispatch synthetic pointer events to underlying element
    const dispatchPointerEvent = (type: string, clientX: number, clientY: number) => {
        const target = document.elementFromPoint(clientX, clientY) as Element | null;
        if (!target) return;

        const ev = new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
            pointerType: 'touch',
            isPrimary: true
        });
        target.dispatchEvent(ev);
    };

    useEffect(() => {
        const el = elRef.current;
        if (!el) return;

        // Update position
        const [cx, cy] = toClient(x, y);
        el.style.left = `${cx}px`;
        el.style.top = `${cy}px`;

        // Handle pointer down/up transitions
        if (!lastPointerDown.current && pointerDown) {
            // down
            dispatchPointerEvent('pointerdown', cx, cy);
            lastPointerDown.current = true;
        } else if (lastPointerDown.current && pointerDown) {
            // move while down
            dispatchPointerEvent('pointermove', cx, cy);
        } else if (lastPointerDown.current && !pointerDown) {
            // up
            dispatchPointerEvent('pointerup', cx, cy);
            // click for convenience
            dispatchPointerEvent('click', cx, cy);
            lastPointerDown.current = false;
        }
    }, [x, y, pointerDown]);

    return (
        <div
            ref={elRef}
            className="pointer-events-none fixed z-[60] transform -translate-x-1/2 -translate-y-1/2"
            style={{
                left: '50%',
                top: '50%',
                transition: 'left 0.1s ease-out, top 0.1s ease-out',
                width: 24,
                height: 24
            }}
        >
            <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${detected ? 'bg-white/90' : 'bg-white/40'} shadow-lg`}>
                <div className={`w-3 h-3 rounded-full ${pointerDown ? 'bg-red-500' : 'bg-fuchsia-600'}`} />
            </div>
        </div>
    );
};
