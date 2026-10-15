import express from 'express';
import type { Request, Response } from 'express';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3000;

// Set up the new Prisma 7 Driver Adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(express.json());
app.get('/api/health',(req:Request,res:Response)=>{
     res.status(200).json({
        status: 'success',
        message: 'DevPrep API is running smoothly.',
        timeStamp: new Date().toISOString()
     });
});
app.get('/api/questions/',async(req:Request,res:Response)=>{
    try{
        const questions = await prisma.question.findMany({
            include:{
                testCases: true
            }
        });
        res.status(200).json({
            status: 'success',
            data: questions
        });
    }
    catch (error){
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch questions from the database.'
        });
    }
});
app.post('/api/questions',async (req:Request, res:Response): Promise<void> =>{
    const { title, description, difficulty, tags, testCases } = req.body;
    if (!title || !description || !difficulty) {
    res.status(400).json({ 
      status: 'error', 
      message: 'Missing required fields' 
    });
    return;
  }

  try {
    // Prisma's nested write: Creates the question AND test cases in one transaction
    const newQuestion = await prisma.question.create({
      data: {
        title,
        description,
        difficulty,
        tags: tags || [],
        testCases: {
          create: testCases || []
        }
      },
      include: {
        testCases: true // Return the newly created test cases in the response
      }
    });

    res.status(201).json({ status: 'success', data: newQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Failed to save question' });
  }
});
app.listen(PORT,() =>{
    console.log(`Server is running at http://localhost:${PORT}`);
});