import { LocationProvider, Router, Route } from 'preact-iso';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Tarot } from './pages/Tarot';
import { Rune } from './pages/Rune';
import { Omikuji } from './pages/Omikuji';
import { IChing } from './pages/IChing';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <LocationProvider>
      <Layout>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/tarot" component={Tarot} />
          <Route path="/rune" component={Rune} />
          <Route path="/omikuji" component={Omikuji} />
          <Route path="/iching" component={IChing} />
          <Route default component={NotFound} />
        </Router>
      </Layout>
    </LocationProvider>
  );
}
