import React from 'react';
import './Skeleton.css';

const Skeleton = ({ width, height, style, className }) => {
    return (
        <div
            className={`skeleton ${className || ''}`}
            style={{
                width: width || '100%',
                height: height || '20px',
                ...style
            }}
        />
    );
};

export default Skeleton;
