const tmdbUrl = 'http://localhost:8020'


const expectedRatingsResponse = {
    found: Cypress._.isArray,
    not_found: Cypress._.isArray
}

const expectedFound = {
    country_code: Cypress._.isString,
    id: Cypress._.isNumber,
    imdb_id: Cypress._.isString,
    original_title: Cypress._.isString,
    poster_path: Cypress._.isString,
    release_date: Cypress._.isString,
    vote_average: Cypress._.isString,
    vote_count: Cypress._.isNumber
}


describe('TMDB Service endpoints', () => {
    it('Status Endpoint', () => {
        const expectedTmdbStatus = {
            total: Cypress._.isNumber,
            fetched: Cypress._.isNumber,
            percentageDone: Cypress._.isNumber,
        }
        cy.request(`${tmdbUrl}/status`)
            .then((resp) => {
                expect(resp.status).to.eq(200);
                expect(resp.body).to.have.all.keys(expectedTmdbStatus);
            })
    });

    it.skip('Get Movie Details Endpoint', () => {
        const expectedMovie = {
            id: Cypress._.isNumber,
            title: Cypress._.isString,
            overview: Cypress._.isString,
            vote_count: Cypress._.isNumber,
        }
        cy.request(`${tmdbUrl}/movie/2,5`)
            .then((resp) => {
                expect(resp.status).to.eq(200);
                expect(resp.body.length).to.be.eq(2);
                resp.body.forEach(movie => {
                    expect(movie).to.have.any.keys(expectedMovie);
                })
            })
    });

    it.skip('Posting ratings.csv should be parseable', () => {
        cy.fixture('ratings', 'base64')
            .then(ratings => Cypress.Blob.base64StringToBlob(ratings, "text/csv"))
            .then(blob => {
                const formData = new FormData();
                formData.append('file', blob, "ratings.csv");

                cy.request({
                    url: `${tmdbUrl}/imdb/ratings`,
                    method: "POST",
                    headers: {
                        'content-type': 'multipart/form-data'
                    },
                    body: formData
                })
                    .then(response => {
                        expect(response.status).to.eq(200);
                        const bodyString = Cypress.Blob.arrayBufferToBinaryString(response.body);
                        const body = JSON.parse(bodyString);

                        expect(body).to.have.all.keys(expectedRatingsResponse);
                        expect(body.found.US.length).to.be.greaterThan(0);
                        body.found.US.forEach(movie => {
                            expect(movie).to.have.all.keys(expectedFound);
                        })
                    })
            })
    });

    it.skip('Get Best Movies From Country Endpoint', () => {
        const expectedResponse = {
            result: Cypress._.isArray,
            total_result: Cypress._.isNumber
        }
        const expectedMovie = {
            en_title: Cypress._.isString,
            _id: Cypress._.isNumber,
            imdb_id: Cypress._.isString,
            original_title: Cypress._.isString,
            poster_path: Cypress._.isString,
            release_date: Cypress._.isString,
            vote_average: Cypress._.isNumber,
            vote_count: Cypress._.isNumber
        }
        cy.request(`${tmdbUrl}/view/best/US`)
            .then((resp) => {
                expect(resp.status).to.eq(200);
                expect(resp.body.length).to.be.greaterThan(0);
            })
    });

})