export interface IScoreDetails {
    assessmentId: string;
    assessmentName: string,
    assessmentDate: string,
    framework?: {
        board?: string,
        medium?: string,
        gradeLevel?: string,
        subject?: string,
        difficultyLevel?: string,
    },
    scoreSummary?: {
        totalCorrect: number,
        totalIncorrect: number,
        totalTimeSpent: string,
        totalResult: number,
    },
    nodalFeedback?: string,
    competenciesScores:  Array<ICompentencyScore>
}

export interface ICompentencyScore {
    name: string,
    score: number,
    levels?: Array<{name: string}>,
    totalQuestion: number,
    correctAnswer: number,
    incorrectAnswer: number,
}
