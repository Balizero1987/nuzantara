import { cn } from '../utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('class1', 'class2')
    expect(result).toContain('class1')
    expect(result).toContain('class2')
  })

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'conditional', false && 'hidden')
    expect(result).toContain('base')
    expect(result).toContain('conditional')
    expect(result).not.toContain('hidden')
  })

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'valid')
    expect(result).toContain('base')
    expect(result).toContain('valid')
  })

  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    // tailwind-merge should deduplicate px-2 and keep px-4
    expect(result).toContain('px-4')
    expect(result).not.toContain('px-2')
  })

  it('should handle empty strings', () => {
    const result = cn('base', '', 'valid')
    expect(result).toContain('base')
    expect(result).toContain('valid')
  })

  it('should handle arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toContain('class1')
    expect(result).toContain('class2')
    expect(result).toContain('class3')
  })

  it('should handle objects with boolean values', () => {
    const result = cn({
      'active': true,
      'disabled': false,
      'hover': true,
    })
    expect(result).toContain('active')
    expect(result).toContain('hover')
    expect(result).not.toContain('disabled')
  })

  it('should return empty string for no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle mixed input types', () => {
    const result = cn(
      'base',
      ['array1', 'array2'],
      { conditional: true, hidden: false },
      'string',
      undefined,
      null
    )
    expect(result).toContain('base')
    expect(result).toContain('array1')
    expect(result).toContain('array2')
    expect(result).toContain('conditional')
    expect(result).toContain('string')
    expect(result).not.toContain('hidden')
  })
})

