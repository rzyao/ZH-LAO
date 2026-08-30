import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// and keeps Expo Go / native build bootstrap identical across platforms.
registerRootComponent(App);
