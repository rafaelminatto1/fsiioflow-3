// pages/TeleconsultaPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Appointment, Patient } from '../types';
import PageLoader from '../components/ui/PageLoader';
import VideoFeed from '../components/teleconsulta/VideoFeed';
import ControlBar from '../components/teleconsulta/ControlBar';
import PatientInfoPanel from '../components/teleconsulta/PatientInfoPanel';
import { Maximize, Minimize } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const TeleconsultaPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { appointments, patients } = useData();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  
  useEffect(() => {
    const app = appointments.find(a => a.id === appointmentId);
    if (app) {
      setAppointment(app);
      const pat = patients.find(p => p.id === app.patientId);
      if (pat) setPatient(pat);
    }
  }, [appointmentId, appointments, patients]);

  const cleanupStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (timerRef.current) {
        clearInterval(timerRef.current);
    }
  }, [localStream]);

  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        timerRef.current = window.setInterval(() => setSessionTime(s => s + 1), 1000);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        showToast("Permissão para câmera/microfone negada.", 'error');
        navigate(`/agenda`);
      }
    };
    
    startMedia();
    return cleanupStream;
  }, [navigate, showToast, cleanupStream]);

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach(track => track.enabled = !isMicOn);
    setIsMicOn(!isMicOn);
  };
  
  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach(track => track.enabled = !isCameraOn);
    setIsCameraOn(!isCameraOn);
  };

  const handleEndCall = () => {
    cleanupStream();
    navigate(`/patients/${patient?.id}`);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        setIsFullscreen(true);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }
  };

  if (!appointment || !patient) {
    return <PageLoader />;
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white -m-8 p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Teleconsulta: {patient.name}</h1>
        <div className="flex items-center gap-4">
           <div className="bg-red-500/80 text-white px-3 py-1 rounded-md text-sm font-semibold flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                <span>REC</span>
                <span className="ml-2 font-mono">{formatTime(sessionTime)}</span>
            </div>
          <button onClick={handleToggleFullscreen} className="p-2 hover:bg-slate-700 rounded-full">
            {isFullscreen ? <Minimize/> : <Maximize />}
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-4 gap-4 overflow-hidden">
        <div className="col-span-3 flex flex-col gap-4">
          <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
            <VideoFeed stream={localStream} isMuted={true} isCameraOn={true} username="Paciente (Simulado)" />
          </div>
          <div className="w-64 h-40 bg-black rounded-lg overflow-hidden self-end relative border-2 border-slate-700">
             <VideoFeed stream={localStream} isMuted={true} isCameraOn={isCameraOn} username="Fisioterapeuta" />
          </div>
        </div>
        <div className="col-span-1 bg-slate-800/50 rounded-lg p-4 overflow-y-auto">
          <PatientInfoPanel patient={patient} />
        </div>
      </main>

      <footer className="mt-4">
        <ControlBar 
            isMicOn={isMicOn}
            isCameraOn={isCameraOn}
            onToggleMic={toggleMic}
            onToggleCamera={toggleCamera}
            onEndCall={handleEndCall}
        />
      </footer>
    </div>
  );
};

export default TeleconsultaPage;
