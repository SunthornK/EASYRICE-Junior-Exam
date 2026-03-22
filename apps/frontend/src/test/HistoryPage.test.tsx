import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import HistoryPage from '../pages/HistoryPage'

// Mock the API module
vi.mock('../api/inspection', () => ({
  fetchHistory: vi.fn().mockResolvedValue([]),
  deleteInspections: vi.fn().mockResolvedValue(undefined),
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('HistoryPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders search filters', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Search with ID')).toBeTruthy()
    expect(screen.getByText('From Date')).toBeTruthy()
    expect(screen.getByText('To Date')).toBeTruthy()
  })

  it('renders Search and Clear Filter buttons', () => {
    renderPage()
    expect(screen.getByText('Search')).toBeTruthy()
    expect(screen.getByText('Clear Filter')).toBeTruthy()
  })

  it('renders Create Inspection button', () => {
    renderPage()
    expect(screen.getByText('+ Create Inspection')).toBeTruthy()
  })

  it('renders table headers', () => {
    renderPage()
    expect(screen.getByText('Create Date - Time')).toBeTruthy()
    expect(screen.getByText('Inspection ID')).toBeTruthy()
    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.getByText('Standard')).toBeTruthy()
    expect(screen.getByText('Note')).toBeTruthy()
  })

  it('renders rows-per-page selector with default 10', () => {
    renderPage()
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('10')
  })

  it('clears the ID input when Clear Filter is clicked', () => {
    renderPage()
    const input = screen.getByPlaceholderText('Search with ID') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'abc123' } })
    expect(input.value).toBe('abc123')
    fireEvent.click(screen.getByText('Clear Filter'))
    expect(input.value).toBe('')
  })
})
