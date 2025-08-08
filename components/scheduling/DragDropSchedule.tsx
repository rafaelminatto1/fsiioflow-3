"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Clock, User, MapPin, AlertCircle, Calendar } from 'lucide-react';

interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  therapistId: string;
  therapistName: string;
  patientId?: string;
  patientName?: string;
  treatmentType?: string;
  roomId?: string;
  roomName?: string;
  status: 'available' | 'booked' | 'blocked';
  color?: string;
}

interface DragDropScheduleProps {
  date: Date;
  timeSlots: TimeSlot[];
  therapists: Array<{ id: string; name: string; color: string }>;
  onSlotUpdate: (slotId: string, updates: Partial<TimeSlot>) => void;
  onConflictDetected: (conflict: { type: string; message: string; slots: string[] }) => void;
}

export const DragDropSchedule: React.FC<DragDropScheduleProps> = ({
  date,
  timeSlots,
  therapists,
  onSlotUpdate,
  onConflictDetected
}) => {
  const [draggedSlot, setDraggedSlot] = useState<TimeSlot | null>(null);
  const [dropTarget, setDropTarget] = useState<{ therapistId: string; timeIndex: number } | null>(null);
  const [conflicts, setConflicts] = useState<Array<{ id: string; message: string; slots: string[] }>>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  // Generate time grid (7 AM to 8 PM in 30-minute slots)
  const timeSlotDuration = 30; // minutes
  const startHour = 7;
  const endHour = 20;
  const totalSlots = (endHour - startHour) * (60 / timeSlotDuration);

  const generateTimeSlots = (): Date[] => {
    const slots: Date[] = [];
    for (let i = 0; i < totalSlots; i++) {
      const hour = Math.floor(i * timeSlotDuration / 60) + startHour;
      const minute = (i * timeSlotDuration) % 60;
      slots.push(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute));
    }
    return slots;
  };

  const timeGrid = generateTimeSlots();

  const handleDragStart = useCallback((e: React.DragEvent, slot: TimeSlot) => {
    setDraggedSlot(slot);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slot.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, therapistId: string, timeIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ therapistId, timeIndex });
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear drop target if leaving the grid entirely
    if (!gridRef.current?.contains(e.relatedTarget as Node)) {
      setDropTarget(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, therapistId: string, timeIndex: number) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedSlot) return;

    const newStartTime = timeGrid[timeIndex];
    const duration = draggedSlot.endTime.getTime() - draggedSlot.startTime.getTime();
    const newEndTime = new Date(newStartTime.getTime() + duration);

    // Check for conflicts
    const conflictingSlots = timeSlots.filter(slot => 
      slot.id !== draggedSlot.id &&
      slot.therapistId === therapistId &&
      slot.status !== 'available' &&
      ((newStartTime >= slot.startTime && newStartTime < slot.endTime) ||
       (newEndTime > slot.startTime && newEndTime <= slot.endTime) ||
       (newStartTime <= slot.startTime && newEndTime >= slot.endTime))
    );

    if (conflictingSlots.length > 0) {
      const conflict = {
        type: 'time_conflict',
        message: `Appointment conflicts with existing booking for ${conflictingSlots[0].patientName}`,
        slots: [draggedSlot.id, ...conflictingSlots.map(s => s.id)]
      };
      onConflictDetected(conflict);
      return;
    }

    // Update the slot
    onSlotUpdate(draggedSlot.id, {
      therapistId,
      startTime: newStartTime,
      endTime: newEndTime
    });

    setDraggedSlot(null);
  }, [draggedSlot, timeGrid, timeSlots, onSlotUpdate, onConflictDetected]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSlotAtPosition = (therapistId: string, timeIndex: number) => {
    const targetTime = timeGrid[timeIndex];
    return timeSlots.find(slot => 
      slot.therapistId === therapistId &&
      slot.startTime.getTime() === targetTime.getTime()
    );
  };

  const getSlotSpan = (slot: TimeSlot) => {
    const duration = slot.endTime.getTime() - slot.startTime.getTime();
    return Math.ceil(duration / (timeSlotDuration * 60 * 1000));
  };

  const renderTimeSlot = (therapist: { id: string; name: string; color: string }, timeIndex: number) => {
    const slot = getSlotAtPosition(therapist.id, timeIndex);
    const isDropTarget = dropTarget?.therapistId === therapist.id && dropTarget?.timeIndex === timeIndex;
    const isDraggedOver = isDropTarget && draggedSlot;

    if (slot && slot.status !== 'available') {
      const span = getSlotSpan(slot);
      return (
        <div
          key={`${therapist.id}-${timeIndex}`}
          className={`
            relative rounded-lg p-2 text-xs cursor-move border-2 transition-all duration-200
            ${slot.status === 'booked' ? 'bg-blue-100 border-blue-300 hover:bg-blue-200' : 'bg-gray-100 border-gray-300'}
            ${draggedSlot?.id === slot.id ? 'opacity-50 scale-95' : ''}
            ${conflicts.some(c => c.slots.includes(slot.id)) ? 'border-red-400 bg-red-100' : ''}
          `}
          style={{ gridRow: `span ${span}`, backgroundColor: therapist.color + '20' }}
          draggable={slot.status === 'booked'}
          onDragStart={(e) => handleDragStart(e, slot)}
        >
          <div className="font-medium text-gray-900 truncate">
            {slot.patientName || 'Available'}
          </div>
          <div className="text-gray-600 truncate">
            {slot.treatmentType}
          </div>
          <div className="flex items-center text-gray-500 mt-1">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formatTime(slot.startTime)}</span>
          </div>
          {slot.roomName && (
            <div className="flex items-center text-gray-500">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">{slot.roomName}</span>
            </div>
          )}
          {conflicts.some(c => c.slots.includes(slot.id)) && (
            <AlertCircle className="absolute top-1 right-1 h-4 w-4 text-red-500" />
          )}
        </div>
      );
    }

    return (
      <div
        key={`${therapist.id}-${timeIndex}`}
        className={`
          border border-gray-200 rounded transition-all duration-200 min-h-[40px]
          ${isDropTarget ? 'border-blue-400 bg-blue-50' : 'hover:bg-gray-50'}
          ${isDraggedOver ? 'border-2 border-dashed border-blue-400' : ''}
        `}
        onDragOver={(e) => handleDragOver(e, therapist.id, timeIndex)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, therapist.id, timeIndex)}
      />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Schedule - {date.toLocaleDateString()}
            </h2>
          </div>
          <div className="text-sm text-gray-600">
            Drag appointments to reschedule
          </div>
        </div>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4 rounded">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {conflicts.length} scheduling conflict(s) detected
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        <div
          ref={gridRef}
          className="grid gap-1 p-4 min-w-max"
          style={{
            gridTemplateColumns: `100px repeat(${therapists.length}, 200px)`,
            gridTemplateRows: `40px repeat(${totalSlots}, 40px)`
          }}
        >
          {/* Time Column Header */}
          <div className="font-medium text-gray-700 text-center py-2 border-b">
            Time
          </div>

          {/* Therapist Headers */}
          {therapists.map((therapist) => (
            <div
              key={therapist.id}
              className="font-medium text-gray-900 text-center py-2 border-b truncate"
              style={{ backgroundColor: therapist.color + '10' }}
            >
              <div className="flex items-center justify-center space-x-1">
                <User className="h-4 w-4" />
                <span>{therapist.name}</span>
              </div>
            </div>
          ))}

          {/* Time Slots */}
          {timeGrid.map((time, timeIndex) => (
            <React.Fragment key={timeIndex}>
              {/* Time Label */}
              <div className="text-xs text-gray-600 text-center py-2 border-r">
                {formatTime(time)}
              </div>

              {/* Therapist Columns */}
              {therapists.map((therapist) => 
                renderTimeSlot(therapist, timeIndex)
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 px-6 py-3 border-t">
        <div className="flex items-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Booked Appointment</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Blocked Time</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 border-2 border-dashed border-blue-400 rounded"></div>
            <span>Drop Target</span>
          </div>
          <div className="flex items-center space-x-1">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <span>Conflict</span>
          </div>
        </div>
      </div>
    </div>
  );
};