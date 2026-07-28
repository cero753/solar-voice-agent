import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Converse from './pages/Converse.tsx'
import Leads from './pages/Leads.tsx'
import ThankYou from './pages/ThankYou.tsx'
import { LeadsProvider } from './context/LeadsContext.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Converse /> },
      { path: 'leads', element: <Leads /> },
      { path: 'thank-you', element: <ThankYou /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LeadsProvider>
      <RouterProvider router={router} />
    </LeadsProvider>
  </StrictMode>,
)
