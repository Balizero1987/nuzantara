import { Toaster as SonnerToaster } from 'sonner';

export function Toaster({ position = 'top-center', ...props }: { position?: 'top-center' | 'top-right' | 'bottom-right' | 'bottom-left' }) {
  return <SonnerToaster position={position} {...props} />;
}

export { toast } from 'sonner';

