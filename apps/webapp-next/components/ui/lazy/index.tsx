// Lazy loading per tutti i componenti UI con fallback skeleton
import dynamic from 'next/dynamic'

// Skeleton components per loading states
const ButtonSkeleton = () => <div className="h-10 w-20 bg-gray-700 rounded animate-pulse" />
const InputSkeleton = () => <div className="h-10 w-full bg-gray-700 rounded animate-pulse" />
const CardSkeleton = () => <div className="h-32 w-full bg-gray-700 rounded-lg animate-pulse" />
const DialogSkeleton = () => <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-pulse" />
const SidebarSkeleton = () => <div className="w-64 h-full bg-gray-800 animate-pulse" />

// Lazy loaded components with proper loading states
export const LazyButton = dynamic(
  () => import('../button'),
  {
    loading: ButtonSkeleton,
    ssr: false // Optimize for client-side only
  }
)

export const LazyInput = dynamic(
  () => import('../input'),
  {
    loading: InputSkeleton,
    ssr: false
  }
)

export const LazyCard = dynamic(
  () => import('../card'),
  {
    loading: CardSkeleton,
    ssr: false
  }
)

export const LazyDialog = dynamic(
  () => import('../dialog'),
  {
    loading: DialogSkeleton,
    ssr: false
  }
)

export const LazySidebar = dynamic(
  () => import('../sidebar'),
  {
    loading: SidebarSkeleton,
    ssr: false
  }
)

// Per componenti più leggeri, loading states semplici
export const LazyLabel = dynamic(() => import('../label'), { ssr: false })
export const LazySeparator = dynamic(() => import('../separator'), { ssr: false })
export const LazySkeleton = dynamic(() => import('../skeleton'), { ssr: false })
export const LazySheet = dynamic(() => import('../sheet'), { ssr: false })
export const LazyToast = dynamic(() => import('../toast'), { ssr: false })

// Batch exports for commonly used groups
export const LazyFormComponents = {
  Input: LazyInput,
  Label: LazyLabel,
  Button: LazyButton,
}

export const LazyLayoutComponents = {
  Sidebar: LazySidebar,
  Separator: LazySeparator,
  Skeleton: LazySkeleton,
}

export const LazyFeedbackComponents = {
  Dialog: LazyDialog,
  Toast: LazyToast,
  Sheet: LazySheet,
}