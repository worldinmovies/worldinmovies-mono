const rabbitAdminUrl = 'http://localhost:15672'

describe('RabbitMQ Smoke Test', () => {
    it('Check Rabbit Admin Availability', () => {
        cy.request(`${rabbitAdminUrl}/`)
            .then((resp) => {
                expect(resp.status).to.eq(200);
            })
    });
})