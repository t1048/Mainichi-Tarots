import { LocationProvider, Router, Route } from 'preact-iso';
import { HashLocationProvider, HASH_LOCATION_CTX } from './lib/hash-location';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Tarot } from './pages/Tarot';
import { Rune } from './pages/Rune';
import { Omikuji } from './pages/Omikuji';
import { IChing } from './pages/IChing';
import { LoveTarot } from './pages/LoveTarot';
import { LoveIChing } from './pages/LoveIChing';
import { Numerology } from './pages/Numerology';
import { NotFound } from './pages/NotFound';

// preact-iso の Router / useLocation がハッシュルーティング用コンテキストを参照するよう差し替え
(LocationProvider as unknown as { ctx: typeof HASH_LOCATION_CTX }).ctx = HASH_LOCATION_CTX;

export function App() {
  return (
    <HashLocationProvider>
      <Layout>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/tarot" component={Tarot} />
          <Route path="/rune" component={Rune} />
          <Route path="/omikuji" component={Omikuji} />
          <Route path="/iching" component={IChing} />
          <Route path="/numerology" component={Numerology} />
          <Route path="/love/tarot" component={LoveTarot} />
          <Route path="/love/iching" component={LoveIChing} />
          <Route default component={NotFound} />
        </Router>
      </Layout>
    </HashLocationProvider>
  );
}
