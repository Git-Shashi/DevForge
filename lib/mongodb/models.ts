import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from './client';
import type { User, Project, ContainerMapping } from '@/types';

// User Collection
export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDatabase();
  return db.collection<User>('users');
}

export async function createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
  const collection = await getUsersCollection();
  const now = new Date();
  
  const result = await collection.insertOne({
    ...userData,
    _id: new ObjectId(),
    createdAt: now,
    updatedAt: now,
  } as User);
  
  return result.insertedId;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const collection = await getUsersCollection();
  return await collection.findOne({ email });
}

export async function findUserById(id: string | ObjectId): Promise<User | null> {
  const collection = await getUsersCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

// Projects Collection
export async function getProjectsCollection(): Promise<Collection<Project>> {
  const db = await getDatabase();
  return db.collection<Project>('projects');
}

export async function createProject(projectData: Omit<Project, '_id' | 'createdAt' | 'updatedAt' | 'lastAccessed' | 'lastActiveAt'>) {
  const collection = await getProjectsCollection();
  const now = new Date();
  
  const result = await collection.insertOne({
    ...projectData,
    _id: new ObjectId(),
    createdAt: now,
    updatedAt: now,
    lastAccessed: now,
    lastActiveAt: now,
  } as Project);
  
  return result.insertedId;
}

export async function findProjectById(id: string | ObjectId): Promise<Project | null> {
  const collection = await getProjectsCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function findProjectsByUserId(userId: string | ObjectId): Promise<Project[]> {
  const collection = await getProjectsCollection();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
  return await collection.find({ userId: objectId }).toArray();
}

export async function updateProject(id: string | ObjectId, updates: Partial<Project>) {
  const collection = await getProjectsCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  
  return await collection.updateOne(
    { _id: objectId },
    { 
      $set: {
        ...updates,
        updatedAt: new Date(),
      }
    }
  );
}

export async function deleteProject(id: string | ObjectId) {
  const collection = await getProjectsCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

export async function updateProjectLastAccessed(id: string | ObjectId) {
  const collection = await getProjectsCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  
  return await collection.updateOne(
    { _id: objectId },
    { 
      $set: {
        lastAccessed: new Date(),
        lastActiveAt: new Date(),
      }
    }
  );
}

// Container Mapping Collection
export async function getContainerMappingsCollection(): Promise<Collection<ContainerMapping>> {
  const db = await getDatabase();
  return db.collection<ContainerMapping>('container_mappings');
}

export async function createContainerMapping(mappingData: Omit<ContainerMapping, '_id' | 'createdAt' | 'lastPingAt'>) {
  const collection = await getContainerMappingsCollection();
  const now = new Date();
  
  const result = await collection.insertOne({
    ...mappingData,
    _id: new ObjectId(),
    createdAt: now,
    lastPingAt: now,
  } as ContainerMapping);
  
  return result.insertedId;
}

export async function findContainerMappingByContainerId(containerId: string): Promise<ContainerMapping | null> {
  const collection = await getContainerMappingsCollection();
  return await collection.findOne({ containerId });
}

export async function findContainerMappingsByUserId(userId: string | ObjectId): Promise<ContainerMapping[]> {
  const collection = await getContainerMappingsCollection();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
  return await collection.find({ userId: objectId }).toArray();
}

export async function updateContainerMapping(containerId: string, updates: Partial<ContainerMapping>) {
  const collection = await getContainerMappingsCollection();
  
  return await collection.updateOne(
    { containerId },
    { 
      $set: {
        ...updates,
        lastPingAt: new Date(),
      }
    }
  );
}

export async function deleteContainerMapping(containerId: string) {
  const collection = await getContainerMappingsCollection();
  return await collection.deleteOne({ containerId });
}

// Create indexes for better query performance
export async function createIndexes() {
  const usersCollection = await getUsersCollection();
  await usersCollection.createIndex({ email: 1 }, { unique: true });
  
  const projectsCollection = await getProjectsCollection();
  await projectsCollection.createIndex({ userId: 1 });
  await projectsCollection.createIndex({ 'docker.containerName': 1 }, { unique: true });
  
  const mappingsCollection = await getContainerMappingsCollection();
  await mappingsCollection.createIndex({ containerId: 1 }, { unique: true });
  await mappingsCollection.createIndex({ userId: 1 });
  await mappingsCollection.createIndex({ projectId: 1 });
}
