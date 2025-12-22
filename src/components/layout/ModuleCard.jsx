import React from 'react';
import { MoreHorizontal, Maximize2, GripHorizontal } from 'lucide-react';

const ModuleCard = ({ title, children, style, className, onExpand, ...props }) => {
    // Separate RGL props (style, className, etc.) from our visual card styling
    // RGL passes 'style' containing the transform for positioning, and 'className' for RGL classes.
    // We must apply these to the root div.
    // Our custom styles and animations must be on an inner div to avoid conflict.

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
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
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
                    <div className="drag-handle" style={{ cursor: 'grab', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>
                        <GripHorizontal size={16} />
                    </div>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        fontFamily: 'var(--font-sans)',
                        flex: 1
                    }}>
                        {title}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
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
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ModuleCard;
