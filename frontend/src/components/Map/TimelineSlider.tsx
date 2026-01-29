import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Calendar } from 'lucide-react';
import './TimelineSlider.css';

interface TimelineSliderProps {
    onDateChange: (date: Date) => void;
    minDate?: Date;
    maxDate?: Date;
}

const TimelineSlider: React.FC<TimelineSliderProps> = ({
    onDateChange,
    minDate = new Date('2025-01-01'),
    maxDate = new Date()
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [sliderValue, setSliderValue] = useState(100); // 0-100 percentage

    const currentDateLabel = useMemo(() => {
        const start = minDate.getTime();
        const end = maxDate.getTime();
        const current = start + (end - start) * (sliderValue / 100);
        const date = new Date(current);
        onDateChange(date);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }, [sliderValue, minDate, maxDate, onDateChange]);

    return (
        <div className="timeline-slider-wrapper">
            <div className="timeline-controls">
                <button
                    className="control-btn play-btn"
                    onClick={() => setIsPlaying(!isPlaying)}
                >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                </button>
                <button className="control-btn reset-btn" onClick={() => setSliderValue(0)}>
                    <RotateCcw size={16} />
                </button>
            </div>

            <div className="slider-main">
                <div className="slider-labels">
                    <span className="date-display">
                        <Calendar size={12} />
                        {currentDateLabel}
                    </span>
                    <span className="progress-hint">{sliderValue === 100 ? 'Present Day' : 'Archived View'}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(parseInt(e.target.value))}
                    className="custom-range-slider"
                />
                <div className="slider-ticks">
                    <span>JAN '25</span>
                    <span>JUL '25</span>
                    <span>JAN '26</span>
                </div>
            </div>
        </div>
    );
};

export default TimelineSlider;
