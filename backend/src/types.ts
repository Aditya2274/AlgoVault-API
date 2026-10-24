export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export interface TestCase{
    input: string;
    expectedoutput: string;
}
export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  testCases: TestCase[]; // An array of the TestCase interface defined above
}

export interface User {
  id: string;
  username: string;
  email: string;
  completedQuestions: string[]; // Array of question IDs
  totalScore: number;
}