import React from 'react';
import { MoreHorizontal, Maximize2, GripHorizontal } from 'lucide-react';

const ModuleCard = ({ title, children, style, className, onExpand, isLocked, ...props }) => {
    // Separate RGL props (style, className, etc.) from our visual card styling
    // RGL passes 'style' containing the transform for positioning, and 'className' for RGL classes.
    // We must apply these to the root div.
    // Our custom styles and animations must be on an inner div to avoid conflict.

    // Extract RGL resize handle from children if present
    const childrenArray = React.Children.toArray(children);
    const resizeHandle = childrenArray.find(child =>
        React.isValidElement(child) &&
        child.props.className &&
        child.props.className.includes('react-resizable-handle')
    );
    const content = childrenArray.filter(child => child !== resizeHandle);

    return (
        <div
            className={className}
            style={style}
            {...props}
        >
            <div
                className="module-card animate-scale-in"
                style={{
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: '16px',
                    padding: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    height: '100%',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    position: 'relative' // Ensure absolute children are relative to this card
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--color-bg)',
                    paddingBottom: '0.5rem'
                }}>
                    {!isLocked && (
                        <div className="drag-handle" style={{ cursor: 'grab', color: 'var(--color-text-muted)', marginRight: '0.5rem', padding: '4px', touchAction: 'none' }}>
                            <GripHorizontal size={20} />
                        </div>
                    )}
                    <h3 className="nodrag" style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        fontFamily: 'var(--font-sans)',
                        flex: 1
                    }}>
                        {title}
                    </h3>
                    <div className="nodrag" style={{ display: 'flex', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                        {onExpand && (
                            <button onClick={onExpand} style={{ color: 'inherit', cursor: 'pointer' }} title="Agrandir">
                                <Maximize2 size={16} />
                            </button>
                        )}
                        <button style={{ color: 'inherit' }}>
                            <MoreHorizontal size={16} />
                        </button>
                    </div>
                </div>

                {/* Content Area - 'nodrag' class allows interaction on mobile/touch without triggering drag */}
                <div className="nodrag" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                    {content}
                </div>

                {/* RGL Resize Handle (Invisible hit area, made larger for easier grab) */}
                {!isLocked && resizeHandle && React.cloneElement(resizeHandle, {
                    style: {
                        ...resizeHandle.props.style,
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '40px', // Increased hit area
                        height: '40px', // Increased hit area
                        zIndex: 20,
                        cursor: 'se-resize'
                    }
                })}

                {/* Visual Resize Handle (Visible Icon) */}
                {!isLocked && (
                    <div style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        width: '24px',
                        height: '24px',
                        pointerEvents: 'none',
                        opacity: 0.8,
                        background: 'var(--color-bg)',
                        borderRadius: '50%',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v6" />
                            <path d="M15 21h6" />
                            <path d="M21 3l-18 18" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModuleCard;
