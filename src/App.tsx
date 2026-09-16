import { HashRouter } from 'react-router-dom'
import { AppProviders } from '@/components/AppProviders'
import { AppRoutes } from '@/routes'

export default function App() {
  return (
    <HashRouter>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </HashRouter>
  )
}
