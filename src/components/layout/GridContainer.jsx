import React, { useState, useEffect, useRef } from 'react';
import { Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { X, Maximize2, Minimize2 } from 'lucide-react';

import { useCouple } from '../../context/CoupleContext';
import _ from 'lodash';

const GridContainer = ({ children }) => {
    const { coupleData, updateCouple } = useCouple();
    const defaultLayouts = {
        lg: [
            { i: 'gallery', x: 0, y: 0, w: 2, h: 3 },
            { i: 'calendar', x: 2, y: 0, w: 2, h: 3 },
            { i: 'timeline', x: 0, y: 3, w: 1, h: 3 },
            { i: 'todo', x: 1, y: 3, w: 1, h: 3 },
            { i: 'meals', x: 2, y: 3, w: 1, h: 3 },
            { i: 'chat', x: 3, y: 3, w: 1, h: 3 },
            { i: 'journal', x: 0, y: 6, w: 2, h: 3 },
            { i: 'surprises', x: 2, y: 6, w: 2, h: 3 }
        ],
        md: [
            { i: 'gallery', x: 0, y: 0, w: 2, h: 3 },
            { i: 'calendar', x: 2, y: 0, w: 2, h: 3 },
            { i: 'timeline', x: 0, y: 3, w: 1, h: 3 },
            { i: 'todo', x: 1, y: 3, w: 1, h: 3 },
            { i: 'meals', x: 2, y: 3, w: 1, h: 3 },
            { i: 'chat', x: 3, y: 3, w: 1, h: 3 },
            { i: 'journal', x: 0, y: 6, w: 2, h: 3 },
            { i: 'surprises', x: 2, y: 6, w: 2, h: 3 }
        ],
        sm: [
            { i: 'gallery', x: 0, y: 0, w: 2, h: 3 },
            { i: 'calendar', x: 0, y: 3, w: 2, h: 3 },
            { i: 'timeline', x: 0, y: 6, w: 1, h: 3 },
            { i: 'todo', x: 1, y: 6, w: 1, h: 3 },
            { i: 'meals', x: 0, y: 9, w: 1, h: 3 },
            { i: 'chat', x: 1, y: 9, w: 1, h: 3 },
            { i: 'journal', x: 0, y: 12, w: 2, h: 3 },
            { i: 'surprises', x: 0, y: 15, w: 2, h: 3 }
        ],
        xs: [
            { i: 'gallery', x: 0, y: 0, w: 1, h: 3 },
            { i: 'calendar', x: 0, y: 3, w: 1, h: 3 },
            { i: 'timeline', x: 0, y: 6, w: 1, h: 3 },
            { i: 'todo', x: 0, y: 9, w: 1, h: 3 },
            { i: 'meals', x: 0, y: 12, w: 1, h: 3 },
            { i: 'chat', x: 0, y: 15, w: 1, h: 3 },
            { i: 'journal', x: 0, y: 18, w: 1, h: 3 },
            { i: 'surprises', x: 0, y: 21, w: 1, h: 3 }
        ]
    };

    const [layouts, setLayouts] = useState(() => {
        // Priority: DB -> LocalStorage -> Default
        if (coupleData?.couple?.dashboard_layout) {
            return coupleData.couple.dashboard_layout;
        }
        const saved = localStorage.getItem('dashboard_layout');
        return saved ? JSON.parse(saved) : defaultLayouts;
    });

    const [width, setWidth] = useState(1200);
    const containerRef = useRef(null);
    const [expandedModule, setExpandedModule] = useState(null);

    // Debounced save function
    const saveToDb = useRef(
        _.debounce((newLayouts) => {
            updateCouple({ dashboard_layout: newLayouts }).catch(console.error);
        }, 2000)
    ).current;

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Sync from DB if it changes externally (and strictly implies a new object reference from context)
    useEffect(() => {
        if (coupleData?.couple?.dashboard_layout) {
            // Check if deeper equality check is needed to avoid loop, 
            // but for now relying on Context passing new ref only on actual update
            // and comparing with local state might be good.
            if (JSON.stringify(coupleData.couple.dashboard_layout) !== JSON.stringify(layouts)) {
                setLayouts(coupleData.couple.dashboard_layout);
            }
        }
    }, [coupleData?.couple?.dashboard_layout]);

    const onLayoutChange = (layout, newLayouts) => {
        setLayouts(newLayouts);
        localStorage.setItem('dashboard_layout', JSON.stringify(newLayouts));
        saveToDb(newLayouts);
    };

    // Clone children to inject props
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, {
                onExpand: () => setExpandedModule(child.props.title),
                className: child.props.className
            });
        }
        return child;
    });

    // Find the expanded module content
    const expandedContent = React.Children.toArray(children).find(
        child => child.props.title === expandedModule
    );

    return (
        <>
            <div ref={containerRef} style={{ width: '100%' }}>
                <Responsive
                    className="layout"
                    layouts={layouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 4, md: 4, sm: 2, xs: 1, xxs: 1 }}
                    rowHeight={150}
                    width={width}
                    onLayoutChange={onLayoutChange}
                    draggableHandle=".drag-handle"
                    draggableCancel=".nodrag"
                    margin={[16, 16]}
                >
                    {childrenWithProps}
                </Responsive>
            </div>

            {/* Expanded Overlay */}
            {expandedModule && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    zIndex: 1000,
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeIn 0.2s'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary)' }}>
                            {expandedModule}
                        </h2>
                        <button
                            onClick={() => setExpandedModule(null)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-bg)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Minimize2 size={24} />
                        </button>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {expandedContent && React.cloneElement(expandedContent, {
                            style: { ...expandedContent.props.style, height: '100%', boxShadow: 'none' },
                            onExpand: null
                        })}
                    </div>
                </div>
            )}
        </>
    );
};

export default GridContainer;
