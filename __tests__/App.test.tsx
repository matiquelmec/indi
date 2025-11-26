import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />)
    // Verificar que la app se renderiza
    expect(document.body).toBeInTheDocument()
  })

  it('contains expected elements', () => {
    const { container } = render(<App />)
    // Verificar que el componente se renderizó correctamente
    expect(container.firstChild).toBeTruthy()
    
    // Verificar que contiene texto esperado de la aplicación
    expect(container).toHaveTextContent('INDI')
    expect(container).toHaveTextContent('Plataforma de Identidad Digital')
  })
})