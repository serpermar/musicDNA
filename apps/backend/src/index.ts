import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`MusicDNA API escuchando en http://localhost:${env.PORT}/api/v1`);
});
