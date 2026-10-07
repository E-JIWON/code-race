import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TicketLab } from './tickets/TicketLab.tsx'

const Root = new URLSearchParams(location.search).has('lab') ? TicketLab : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
