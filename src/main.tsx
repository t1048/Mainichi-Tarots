import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import './styles/tokens.css';
import './styles/global.css';

registerSW({ immediate: true });

const root = document.getElementById('app');
if (root) {
  render(<App />, root);
}
