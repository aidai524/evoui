import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './nui3/css/tailwind.css'
import './docs/docs.css'
import { DocsSite } from './docs/DocsSite'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DocsSite />
  </StrictMode>,
)
