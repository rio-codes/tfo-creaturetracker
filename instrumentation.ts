export async function register() {
    const apiKey = process.env.HYPERDX_API_KEY;
    const serviceName = process.env.OTEL_SERVICE_NAME;

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { init } = await import('@hyperdx/node-opentelemetry');
        init({
            apiKey: apiKey,
            service: serviceName,
            additionalInstrumentations: [], // optional, default: []
        });
    }
}
