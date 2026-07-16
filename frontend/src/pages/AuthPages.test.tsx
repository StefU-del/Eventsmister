import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../test/render'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'

describe('authentication pages', () => {
  it('submits login credentials through the auth provider', async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(<LoginPage />, { auth: { login } })

    await user.type(screen.getByLabelText('Username'), 'citywalker')
    await user.type(screen.getByLabelText('Password'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(login).toHaveBeenCalledWith({
      username: 'citywalker',
      password: 'Password123!',
    })
  })

  it('shows login errors returned by the auth provider', async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockRejectedValue(new Error('Invalid username or password'))
    renderWithProviders(<LoginPage />, { auth: { login } })

    await user.type(screen.getByLabelText('Username'), 'citywalker')
    await user.type(screen.getByLabelText('Password'), 'WrongPassword1!')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password')
  })

  it('submits a secure registration', async () => {
    const user = userEvent.setup()
    const register = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(<RegisterPage />, { auth: { register } })

    await user.type(screen.getByLabelText(/^Username/), 'new_londoner')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText(/^Password/), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(register).toHaveBeenCalledWith({
      username: 'new_londoner',
      email: 'new@example.com',
      password: 'Password123!',
    })
  })
})
