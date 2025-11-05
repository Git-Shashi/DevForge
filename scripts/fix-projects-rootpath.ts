import { getDatabase } from '../lib/mongodb/client';
import { ObjectId } from 'mongodb';

async function fixProjectsRootPath() {
  try {
    const db = await getDatabase();
    const projectsCollection = db.collection('projects');
    
    // Find projects without rootPath
    const projectsWithoutRootPath = await projectsCollection.find({
      $or: [
        { rootPath: { $exists: false } },
        { rootPath: null },
        { rootPath: '' }
      ]
    }).toArray();
    
    console.log(`Found ${projectsWithoutRootPath.length} projects without rootPath`);
    
    // Update each project
    for (const project of projectsWithoutRootPath) {
      const userId = project.userId.toString();
      const projectId = project._id.toString();
      const rootPath = `${process.env.DOCKER_PROJECTS_PATH}/${userId}/${projectId}`;
      
      await projectsCollection.updateOne(
        { _id: project._id },
        { 
          $set: { 
            rootPath,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log(`✓ Fixed project ${project.projectName} (${projectId})`);
      console.log(`  rootPath: ${rootPath}`);
    }
    
    console.log('\nDone! All projects updated.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing projects:', error);
    process.exit(1);
  }
}

fixProjectsRootPath();
