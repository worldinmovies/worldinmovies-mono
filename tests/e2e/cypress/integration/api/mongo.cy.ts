const mongoUrl = 'mongodb://localhost:27017/tmdb?authSource=tmdb'

describe('Mongo Smoke Test', () => {
    it('Check Mongo Availability', () => {
        cy.task('ping_mongo', mongoUrl)
            .then(ping => {
                console.log(ping);
                expect(ping.ok).to.be.eq(1);
            });
    });
})