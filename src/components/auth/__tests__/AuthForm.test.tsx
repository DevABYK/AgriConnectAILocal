import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthForm } from '../AuthForm'
import { authAPI } from '@/lib/api'

// Mock the authAPI
vi.mock('@/lib/api', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
  },
}))

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('AuthForm', () => {
  const mockOnAuthSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Login Form', () => {
    it('renders login form correctly', () => {
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />)

      expect(screen.getByText('Login')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /login/i })

      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })
    })

    it('validates password length', async () => {
      const user = userEvent.setup()
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, '123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
      })
    })

    it('calls login API and onAuthSuccess on successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        user_type: 'farmer',
        created_at: '2024-01-01T00:00:00Z'
      }

      vi.mocked(authAPI.login).mockResolvedValueOnce(mockUser)

      const user = userEvent.setup()
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith('test@example.com', 'password123')
        expect(mockOnAuthSuccess).toHaveBeenCalled()
      })
    })

    it('shows error message on login failure', async () => {
      vi.mocked(authAPI.login).mockRejectedValueOnce(new Error('Invalid credentials'))

      const user = userEvent.setup()
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument()
      })
    })
  })

  describe('Registration Form', () => {
    it('renders registration form correctly', () => {
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />)

      // Switch to register tab
      const registerTab = screen.getByRole('tab', { name: /register/i })
      fireEvent.click(registerTab)

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByText('I am a')).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('validates password confirmation', async () => {
      const user = userEvent.setup()
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />)

      // Switch to register tab
      const registerTab = screen.getByRole('tab', { name: /register/i })
      fireEvent.click(registerTab)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(fullNameInput, 'Test User')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'differentpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
      })
    })

    it('calls register API and onAuthSuccess on successful registration', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        user_type: 'farmer',
        created_at: '2024-01-01T00:00:00Z'
      }

      vi.mocked(authAPI.register).mockResolvedValueOnce(mockUser)

      const user = userEvent.setup()
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />)

      // Switch to register tab
      const registerTab = screen.getByRole('tab', { name: /register/i })
      fireEvent.click(registerTab)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const userTypeSelect = screen.getByRole('combobox')
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(fullNameInput, 'Test User')
      await user.type(emailInput, 'test@example.com')
      fireEvent.mouseDown(userTypeSelect)
      const farmerOption = screen.getByRole('option', { name: /farmer/i })
      fireEvent.click(farmerOption)
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(authAPI.register).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User', 'farmer')
        expect(mockOnAuthSuccess).toHaveBeenCalled()
      })
    })
  })
})