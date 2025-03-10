import request from 'supertest';

const BASE_URL = 'http://localhost';
const AUTH_SERVICE = `${BASE_URL}:3000`;
const TASK_SERVICE = `${BASE_URL}:3002`;
const SKILL_SERVICE = `${BASE_URL}:3001`;
const OFFER_SERVICE = `${BASE_URL}:3003`;

let contractorToken: string;
let clientToken: string;
let refreshToken: string;

let taskId: number;
let skillId: number;
let offerId: number;

const contractorEmail = 'contractor1@example.com';
const clientEmail = 'client1@example.com';
const password = 'Welcome@123';

/**
 * Helper function to convert `email*password` to Base64
 */
const encodeAuth = (email: string, password: string): string => {
  return Buffer.from(`SMP:${email}*${password}`).toString('base64');
};

describe('Skill Marketplace - End-to-End Tests', () => {
  /** AUTH **/
  it('Contractor should sign up', async () => {
    const res = await request(AUTH_SERVICE).post('/user/signup').send({
      providerType: 'individual',
      firstName: 'Aryu',
      lastName: 'Ivat',
      email: contractorEmail,
      password: password,
      mobileNumber: '1234567890',
      role: 'contractor',
    });

    expect([200, 201]).toContain(res.statusCode);
  });

  it('Client should sign up', async () => {
    const res = await request(AUTH_SERVICE).post('/user/signup').send({
      providerType: 'company',
      firstName: 'Nikhil',
      lastName: 'Smith',
      email: clientEmail,
      password: password,
      mobileNumber: '9876543210',
      role: 'client',
      companyName: 'Tech Solutions Inc.',
      businessTaxNumber: 'AB12345678',
    });

    expect([200, 201]).toContain(res.statusCode);
  });

  it('Contractor should log in and receive tokens', async () => {
    const res = await request(AUTH_SERVICE).post('/user/login').set('authorization', encodeAuth(contractorEmail, password));

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    contractorToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('Client should log in and receive tokens', async () => {
    const res = await request(AUTH_SERVICE).post('/user/login').set('authorization', encodeAuth(clientEmail, password));

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    clientToken = res.body.data.accessToken;
  });

  /** TASK **/
  it('Client should create a task', async () => {
    const res = await request(TASK_SERVICE).post('/task/add').set('Authorization', `Bearer ${clientToken}`).send({
      category_id: 1,
      task_name: 'Build API',
      description: 'Create a REST API in Node.js',
      start_date: '2024-06-10',
      no_of_working_hours: 8,
      hourly_rate: 50,
      currency: 'USD',
    });

    expect(res.statusCode).toBe(201);
    taskId = res.body.taskId;
  });

  it('Client should update task details', async () => {
    const res = await request(TASK_SERVICE)
      .patch(`/task/${taskId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ no_of_working_hours: 10 });

    expect(res.statusCode).toBe(200);
  });

  it('Contractor should update task progress', async () => {
    const res = await request(TASK_SERVICE)
      .patch(`/task/${taskId}/progress`)
      .set('Authorization', `Bearer ${contractorToken}`)
      .send({ description: 'Progress made on the API' });

    expect(res.statusCode).toBe(200);
  });

  it('Client should accept task completion', async () => {
    const res = await request(TASK_SERVICE).patch(`/task/${taskId}/accept-completion`).set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
  });

  /** SKILL **/
  it('Contractor should add a skill', async () => {
    const res = await request(SKILL_SERVICE).post('/skill/add').set('Authorization', `Bearer ${contractorToken}`).send({
      name: 'Node.js',
      experience: 5,
      hourly_rate: 60,
      currency: 'USD',
    });

    expect(res.statusCode).toBe(201);
    skillId = res.body.skillId;
  });

  it('Contractor should update a skill', async () => {
    const res = await request(SKILL_SERVICE)
      .patch(`/skill/${skillId}`)
      .set('Authorization', `Bearer ${contractorToken}`)
      .send({ experience: 6 });

    expect(res.statusCode).toBe(200);
  });

  /** OFFER **/
  it('Contractor should create an offer for the task', async () => {
    const res = await request(OFFER_SERVICE).post(`/offer/task/${taskId}/add`).set('Authorization', `Bearer ${contractorToken}`).send({
      proposal: 'I will complete this in 2 days',
      hourly_rate: 40,
    });

    expect(res.statusCode).toBe(201);
    offerId = res.body.offerId;
  });

  it('Client should accept the offer', async () => {
    const res = await request(OFFER_SERVICE).patch(`/offer/${offerId}/accept`).set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
  });

  it('Client should fetch offers for the task', async () => {
    const res = await request(OFFER_SERVICE).get(`/offer/task/${taskId}`).set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
  });

  it('Client should reject an offer', async () => {
    const res = await request(OFFER_SERVICE).patch(`/offer/${offerId}/reject`).set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
  });

  /** REFRESH TOKEN **/
  it('Contractor should refresh token successfully', async () => {
    const res = await request(AUTH_SERVICE).post('/user/refresh-token').set('Authorization', `Bearer ${refreshToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('newToken');
    contractorToken = res.body.newToken;
  });

  it('Contractor should log out', async () => {
    const res = await request(AUTH_SERVICE).post('/user/logout').set('Authorization', `Bearer ${contractorToken}`);

    expect(res.statusCode).toBe(200);
  });

  it('Client should log out', async () => {
    const res = await request(AUTH_SERVICE).post('/user/logout').set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
  });
});
