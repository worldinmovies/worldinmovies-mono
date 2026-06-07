import { defineConfig } from 'cypress'
import { MongoClient } from 'mongodb';


module.exports = defineConfig({
    e2e: {
        baseUrl: 'http://localhost',
        specPattern: "cypress/integration/**/*.cy.{js,jsx,ts,tsx}",
        experimentalRunAllSpecs: true,
        chromeWebSecurity: false,
        screenshotOnRunFailure: true,
        retries: 3,
        setupNodeEvents(on, config) {
            on("task", {
                async ping_mongo(mongo_url) {
                    const client = new MongoClient(mongo_url);
                    await client.connect();
                    return client.db('tmdb')
                        .admin()
                        .ping();
                }
            })
        }
    }
})