import 'dotenv/config';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { MongoClient } from 'mongodb';
import {
  createAcaiClient,
  type AcaiConfig,
  type ChatCompletionRequest,
} from '@acoustic/ac-ai-ts';

const AWS_REGION = process.env.AWS_REGION!;
const SSM_SERVERS = process.env.SSM_SERVERS!;
const SSM_USER = process.env.SSM_USER!;
const SSM_PASSWORD = process.env.SSM_PASSWORD!;

async function getSsmParameter(ssm: SSMClient, name: string): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  const value = result.Parameter?.Value;
  if (!value) {
    throw new Error(`SSM parameter ${name} is empty or not found`);
  }
  return value;
}

async function createMongoClient(ssm: SSMClient): Promise<MongoClient> {
  console.log('Resolving MongoDB credentials from SSM...');
  const [servers, user, password] = await Promise.all([
    getSsmParameter(ssm, SSM_SERVERS),
    getSsmParameter(ssm, SSM_USER),
    getSsmParameter(ssm, SSM_PASSWORD),
  ]);

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const url = `mongodb+srv://${encodedUser}:${encodedPassword}@${servers}`;

  console.log(`Connecting to MongoDB Atlas (servers: ${servers})...`);
  const client = new MongoClient(url);
  await client.connect();
  console.log('MongoDB connected.\n');
  return client;
}

const request: ChatCompletionRequest = {
  model: process.env.ACAI_MODEL!,
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, what can you do?' },
  ],
  feature: 'test-feature',
  maxTokens: 1000,
  temperature: 0.7,
};

async function main() {
  console.log('--- ACAI Test App ---\n');

  const ssm = new SSMClient({ region: AWS_REGION });
  const mongoClient = await createMongoClient(ssm);

  try {
    const config: AcaiConfig = {
      awsRegion: AWS_REGION,
      mongoClient,
    };

    const client = await createAcaiClient(config);
    const response = await client.chat(process.env.SUBSCRIBER_ID!, request);

    console.log('Response model:', response.model);
    console.log('Choices:', response.choices.length);
    console.log('First choice:', response.choices[0]?.message.content);
    console.log('Usage:', response.usage);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoClient.close();
  }
}

main();
