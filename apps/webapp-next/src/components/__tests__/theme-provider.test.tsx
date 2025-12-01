import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '../theme-provider'

// Mock next-themes
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="next-themes-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}))

describe('ThemeProvider', () => {
  it('should render children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Child content</div>
      </ThemeProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('should pass props to NextThemesProvider', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div>Content</div>
      </ThemeProvider>
    )

    const provider = screen.getByTestId('next-themes-provider')
    const props = JSON.parse(provider.getAttribute('data-props') || '{}')

    expect(props.attribute).toBe('class')
    expect(props.defaultTheme).toBe('dark')
    expect(props.enableSystem).toBe(true)
  })

  it('should work with custom theme values', () => {
    render(
      <ThemeProvider themes={['light', 'dark', 'system']} forcedTheme="light">
        <div data-testid="themed-content">Themed</div>
      </ThemeProvider>
    )

    const provider = screen.getByTestId('next-themes-provider')
    const props = JSON.parse(provider.getAttribute('data-props') || '{}')

    expect(props.themes).toEqual(['light', 'dark', 'system'])
    expect(props.forcedTheme).toBe('light')
  })

  it('should render without any props', () => {
    const { container } = render(
      <ThemeProvider>
        <span>No props</span>
      </ThemeProvider>
    )

    expect(container).toBeInTheDocument()
    expect(screen.getByText('No props')).toBeInTheDocument()
  })
})
