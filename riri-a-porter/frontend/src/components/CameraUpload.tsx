'use client';

import { Camera, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function CameraUpload() {
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const file = e.target.files[0];

        // Mock upload to backend
        const formData = new FormData();
        formData.append('user_photo', file);
        formData.append('garment_photo', file); // Just mocking for now

        try {
            const response = await fetch('http://localhost:8000/try-on', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            console.log('Try-on result:', data);
            alert('Magic VTO Complete! (Check console for mock URL)');
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Gaston is judging you.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <label className={`
        flex items-center justify-center w-14 h-14 rounded-full 
        bg-black text-white shadow-lg cursor-pointer 
        hover:bg-gray-800 transition-transform active:scale-95
        ${isUploading ? 'opacity-70 cursor-wait' : ''}
      `}>
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={isUploading}
                />
                {isUploading ? <Loader2 className="animate-spin" /> : <Camera size={24} />}
            </label>
        </div>
    );
}
