import { renderHook, act } from '@testing-library/react'
import { useToast, toast, reducer } from '../use-toast'

describe('useToast', () => {
  // Each test starts fresh due to module reset behavior
  // We just need to ensure no toast leaks between tests

  describe('toast function', () => {
    it('should create a toast with title', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        toast({ title: 'Test Toast' })
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].title).toBe('Test Toast')
    })

    it('should create a toast with description', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        toast({ title: 'Title', description: 'Description text' })
      })

      expect(result.current.toasts[0].description).toBe('Description text')
    })

    it('should return toast id and dismiss function', () => {
      let toastResult: ReturnType<typeof toast>

      act(() => {
        toastResult = toast({ title: 'Test' })
      })

      expect(toastResult!.id).toBeDefined()
      expect(typeof toastResult!.dismiss).toBe('function')
      expect(typeof toastResult!.update).toBe('function')
    })

    it('should generate unique ids', () => {
      let id1: string
      let id2: string

      act(() => {
        id1 = toast({ title: 'Toast 1' }).id
        id2 = toast({ title: 'Toast 2' }).id
      })

      expect(id1!).not.toBe(id2!)
    })

    it('should set open to true by default', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        toast({ title: 'Test' })
      })

      expect(result.current.toasts[0].open).toBe(true)
    })
  })

  describe('dismiss', () => {
    it('should dismiss specific toast', () => {
      const { result } = renderHook(() => useToast())
      let toastId: string

      act(() => {
        toastId = toast({ title: 'Test' }).id
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        result.current.dismiss(toastId!)
      })

      // Toast should be marked as closed
      expect(result.current.toasts[0].open).toBe(false)
    })

    it('should dismiss all toasts when no id provided', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        toast({ title: 'Toast 1' })
      })

      act(() => {
        result.current.dismiss()
      })

      // All toasts should be closed
      result.current.toasts.forEach((t) => {
        expect(t.open).toBe(false)
      })
    })
  })

  describe('update', () => {
    it('should update toast properties', () => {
      const { result } = renderHook(() => useToast())
      let toastResult: ReturnType<typeof toast>

      act(() => {
        toastResult = toast({ title: 'Original' })
      })

      act(() => {
        toastResult!.update({ title: 'Updated', description: 'New description' })
      })

      const updatedToast = result.current.toasts.find((t) => t.id === toastResult!.id)
      expect(updatedToast?.title).toBe('Updated')
      expect(updatedToast?.description).toBe('New description')
    })
  })

  describe('TOAST_LIMIT', () => {
    it('should limit toasts to 1', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        toast({ title: 'Toast 1' })
        toast({ title: 'Toast 2' })
        toast({ title: 'Toast 3' })
      })

      // Only 1 toast should be visible due to TOAST_LIMIT
      expect(result.current.toasts.length).toBeLessThanOrEqual(1)
    })
  })
})

describe('reducer', () => {
  const initialState = { toasts: [] }

  describe('ADD_TOAST', () => {
    it('should add toast to state', () => {
      const newToast = { id: '1', title: 'Test', open: true }
      const result = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast,
      })

      expect(result.toasts).toHaveLength(1)
      expect(result.toasts[0]).toEqual(newToast)
    })

    it('should prepend new toast', () => {
      const state = {
        toasts: [{ id: '1', title: 'First', open: true }],
      }
      const newToast = { id: '2', title: 'Second', open: true }

      const result = reducer(state, {
        type: 'ADD_TOAST',
        toast: newToast,
      })

      expect(result.toasts[0].id).toBe('2')
    })

    it('should limit to TOAST_LIMIT', () => {
      const state = {
        toasts: [{ id: '1', title: 'First', open: true }],
      }

      // Add multiple toasts
      let result = reducer(state, {
        type: 'ADD_TOAST',
        toast: { id: '2', title: 'Second', open: true },
      })
      result = reducer(result, {
        type: 'ADD_TOAST',
        toast: { id: '3', title: 'Third', open: true },
      })

      expect(result.toasts.length).toBeLessThanOrEqual(1)
    })
  })

  describe('UPDATE_TOAST', () => {
    it('should update existing toast', () => {
      const state = {
        toasts: [{ id: '1', title: 'Original', open: true }],
      }

      const result = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      })

      expect(result.toasts[0].title).toBe('Updated')
      expect(result.toasts[0].open).toBe(true)
    })

    it('should not update non-existent toast', () => {
      const state = {
        toasts: [{ id: '1', title: 'Original', open: true }],
      }

      const result = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '999', title: 'Updated' },
      })

      expect(result.toasts[0].title).toBe('Original')
    })
  })

  describe('DISMISS_TOAST', () => {
    it('should set open to false for specific toast', () => {
      const state = {
        toasts: [
          { id: '1', title: 'First', open: true },
          { id: '2', title: 'Second', open: true },
        ],
      }

      const result = reducer(state, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      })

      expect(result.toasts[0].open).toBe(false)
      expect(result.toasts[1].open).toBe(true)
    })

    it('should dismiss all toasts when no id', () => {
      const state = {
        toasts: [
          { id: '1', title: 'First', open: true },
          { id: '2', title: 'Second', open: true },
        ],
      }

      const result = reducer(state, {
        type: 'DISMISS_TOAST',
        toastId: undefined,
      })

      result.toasts.forEach((t) => {
        expect(t.open).toBe(false)
      })
    })
  })

  describe('REMOVE_TOAST', () => {
    it('should remove specific toast', () => {
      const state = {
        toasts: [
          { id: '1', title: 'First', open: true },
          { id: '2', title: 'Second', open: true },
        ],
      }

      const result = reducer(state, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      })

      expect(result.toasts).toHaveLength(1)
      expect(result.toasts[0].id).toBe('2')
    })

    it('should remove all toasts when no id', () => {
      const state = {
        toasts: [
          { id: '1', title: 'First', open: true },
          { id: '2', title: 'Second', open: true },
        ],
      }

      const result = reducer(state, {
        type: 'REMOVE_TOAST',
        toastId: undefined,
      })

      expect(result.toasts).toHaveLength(0)
    })
  })
})
