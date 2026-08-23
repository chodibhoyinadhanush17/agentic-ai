import '../styles/globals.css';
import { useEffect } from 'react';
import Head from 'next/head';
import { useAuthStore } from '../store/authStore.js';
import { useThemeStore } from '../store/themeStore.js';

export default function App({ Component, pageProps }) {
  const initAuth = useAuthStore((state) => state.initAuth);
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  return (
    <>
      <Head>
        <title>Agentflow_AI | Autonomous Multi-Agent Operations Console</title>
        <meta
          name="description"
          content="Agentic AI Operations Automation Platform. Generate executable visual workflows from natural language prompts and orchestrate 5 cooperating agents."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
