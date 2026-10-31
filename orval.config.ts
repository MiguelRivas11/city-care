import { defineConfig } from 'orval'

export default defineConfig({
  cityCare: {
    input: {
      target: './openapi/city-care.v1.yaml',
    },

    output: {
      mode: 'single',
      target: './sdk/generated/city-care.ts',
      client: 'fetch',
      indexFiles: false,
      baseUrl: {
        getBaseUrlFromSpecification: true,
      },

      override: {
        fetch: {
          includeHttpResponseReturnType: false,
          forceSuccessResponse: true,
        },
      },
    },
  },
})
