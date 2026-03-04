import { useState, useEffect, useRef, useCallback } from 'react';

interface MediaDevicesState {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  hasCamera: boolean;
  hasMicrophone: boolean;
  error: string | null;
  isLoading: boolean;
  startDevices: () => Promise<void>;
  stopDevices: () => void;
}

export function useMediaDevices(): MediaDevicesState {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      });
      setStream(mediaStream);
      setHasCamera(mediaStream.getVideoTracks().length > 0);
      setHasMicrophone(mediaStream.getAudioTracks().length > 0);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera/microphone access denied. Please allow access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found on this device.');
      } else {
        setError(err.message || 'Failed to access media devices.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopDevices = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setHasCamera(false);
      setHasMicrophone(false);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  return { stream, videoRef, hasCamera, hasMicrophone, error, isLoading, startDevices, stopDevices };
}
