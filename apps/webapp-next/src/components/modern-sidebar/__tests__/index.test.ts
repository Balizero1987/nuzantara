// Test for index.ts exports
import * as exports from '../index'

describe('modern-sidebar exports', () => {
  it('should export ModernSidebar', () => {
    expect(exports.ModernSidebar).toBeDefined()
  })

  it('should export ChatHistory', () => {
    expect(exports.ChatHistory).toBeDefined()
  })

  it('should export SidebarProvider', () => {
    expect(exports.SidebarProvider).toBeDefined()
  })

  it('should export useSidebar', () => {
    expect(exports.useSidebar).toBeDefined()
  })
})
