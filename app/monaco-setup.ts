'use client';

// This must run before Monaco Editor is imported
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.MonacoEnvironment = {
    getWorker(_moduleId: string, label: string) {
      // Create a minimal worker that does nothing
      const workerCode = `
        self.onmessage = () => {
          // Do nothing
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      return new Worker(workerUrl);
    }
  };
}

export {};
