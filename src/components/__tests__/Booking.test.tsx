import { render, screen } from '@testing-library/react';
import { Booking } from '../Booking';
import { AuthProvider } from '../../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock('../../services/calendarService', () => ({
  fetchAvailableSlots: vi.fn(),
  bookAppointment: vi.fn(),
  fetchUserAppointments: vi.fn().mockResolvedValue([]),
  cancelAppointment: vi.fn()
}));

// Mock Auth Context to simulate logged in user
vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: '123',
        name: 'Test User',
        email: 'test@example.com'
      },
      login: vi.fn(),
      isLoading: false
    })
  };
});

describe('Booking Component', () => {
  it('renders booking page header', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Booking />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Agenda Disponível')).toBeInTheDocument();
  });
});
